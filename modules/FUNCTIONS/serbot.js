import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot, getSubBotCount, registerPairingMessage } from '../../core/s/serbot-bridge.js';

const DB_PATH = path.resolve('database/local_db.json');

function getDb() {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ maxSubbots: 3 }, null, 2), 'utf-8');
            return { maxSubbots: 3 };
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8').trim();
        if (!data || data === '{}') {
            fs.writeFileSync(DB_PATH, JSON.stringify({ maxSubbots: 3 }, null, 2), 'utf-8');
            return { maxSubbots: 3 };
        }
        const parsed = JSON.parse(data);
        if (typeof parsed.maxSubbots !== 'number') {
            parsed.maxSubbots = 3;
            fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return parsed;
    } catch {
        return { maxSubbots: 3 };
    }
}

function saveDb(data) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const serbotCommand = {
    category: 'main',
    commands: {
        serbot: {
            name: 'serbot',
            alias: ['code'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                try {
                    await m.react('⏳');
                    const i = global.img(conn);

                    global.serbotCooldown = global.serbotCooldown || {};
                    const senderId = m.sender ? jidNormalizedUser(m.sender) : '';
                    if (!senderId) return;

                    const tiempoActual = Date.now();
                    const tiempoEspera = 1 * 60 * 1000;

                    if (global.serbotCooldown[senderId] && (tiempoActual - global.serbotCooldown[senderId] < tiempoEspera)) {
                        const minutosRestantes = Math.ceil((tiempoEspera - (tiempoActual - global.serbotCooldown[senderId])) / (60 * 1000));
                        await m.react('❌');
                        return await m.reply(`⚠ *ESPERA DEMASIADO RÁPIDO*\n\nYa has solicitado un emparejamiento recientemente. Por favor, espera *${minutosRestantes} minuto(s)* antes de volver a usar el comando para no saturar el servidor.`);
                    }

                    const db = getDb();
                    const MAX_SUBBOTS = db.maxSubbots;
                    const activeCount = await getSubBotCount();

                    if (activeCount >= MAX_SUBBOTS) {
                        const botones = [
                            { text: '🌐 Visitar Web', url: 'https://dix.lat/planes' }
                        ];
                        const opciones = {
                            title: "亗  CAPACIDAD LLENA  亗",
                            footer: "Planes VIP Disponibles",
                            quoted: m,
                            image: i
                        };
                        await m.react('❌');
                        return await conn.sendButtonMessage(m.chat, `No se encontraron espacios gratuitos disponibles en este momento.\n\n> *Planes VIP Disponibles:*\n> • Vinculación Premium: $10 USD / 1er mes\n> • Pase Anual Premium: $60 USD / Año\n> • Pase Trimestral Gold: $20 USD / 3 meses`, botones, opciones);
                    }

                    let targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') : (senderId.split('@')[0] || '');
                    if (!targetNum || targetNum.length < 8) {
                        await m.react('❌');
                        return await m.reply('⚠ Número inválido. Usa el comando sin argumentos para tu número o escribe el número completo con código de país.');
                    }

                    let code;
                    try {
                        code = await startSubBot(m, conn, targetNum, { isCode: true });
                    } catch (startErr) {
                        await m.react('❌');
                        const msg = startErr?.message || String(startErr);
                        if (msg.includes('ya está vinculado')) {
                            return await m.reply(`✅ Ese número ya está vinculado y conectado. No hace falta pedir un código nuevo.`);
                        }
                        return await m.reply(`⚠ Error al iniciar el sub-bot:\n\n${msg}`);
                    }

                    if (code && typeof code === 'string') {
                        global.serbotCooldown[senderId] = tiempoActual;

                        const instructions = `亗  *${name()}* 亗\n\n༂ꦽ  ① DISPOSITIVOS VINCULADOS\n༂ꦽ  ② VINCULAR CON NÚMERO\n༂ꦽ  ③ INGRESAR EL CÓDIGO\n\n✰ *SOLICITUD:* @${targetNum}\n✰ *CAPACIDAD:* ${activeCount}/${MAX_SUBBOTS}\n\nTu código de vinculación es: *${code}*`;

                        const botonesUnificados = [
                            { text: '📋 Copiar Código', copy: code },
                            { text: '📜 Ver Reglas', id: '.reglas-subbot' }
                        ];

                        const opcionesUnificadas = {
                            title: "VINCULACIÓN DE SUB-BOT",
                            footer: name(),
                            quoted: m,
                            image: i
                        };
                        await m.react('✅');

                        const sentMsg = await conn.sendButtonMessage(m.chat, instructions, botonesUnificados, opcionesUnificadas);
                        if (sentMsg?.key) {
                            registerPairingMessage(targetNum, m.chat, sentMsg.key);
                        }
                    } else {
                        await m.react('❌');
                        await m.reply(`⚠ No se pudo obtener el código de vinculación (Respuesta vacía o inválida).`);
                    }
                } catch (err) {
                    console.error(err);
                    await m.react('❌');
                    await m.reply("Error en la ejecución del comando serbot:\n\n" + err.message);
                }
            }
        },
        setmaxsubbots: {
            name: 'setmaxsubbots',
            alias: ['setmaxbot', 'setmaxbots'],
            run: async (m, { args, usedPrefix, command, isROwner }) => {
                try {
                    if (!isROwner) return;

                    if (!args[0] || isNaN(args[0])) {
                        await m.react('❌');
                        return await m.reply(`⚠ Uso incorrecto del comando.\n\n*Ejemplo:* ${usedPrefix}${command} 5`);
                    }

                    const newLimit = parseInt(args[0], 10);
                    if (newLimit < 0) {
                        await m.react('❌');
                        return await m.reply('⚠ La cantidad de subbots debe ser un número igual o mayor a 0.');
                    }

                    const db = getDb();
                    const oldLimit = db.maxSubbots;
                    db.maxSubbots = newLimit;
                    saveDb(db);

                    await m.react('✅');
                    return await m.reply(`✅ *LÍMITE DE SUBBOTS ACTUALIZADO*\n\n• *Anterior:* ${oldLimit}\n• *Nuevo Límite:* ${newLimit}\n• *Guardado en:* database/local_db.json`);
                } catch (err) {
                    console.error(err);
                    await m.react('❌');
                    await m.reply("Error en la ejecución del comando setmaxsubbots:\n\n" + err.message);
                }
            }
        }
    }
};
