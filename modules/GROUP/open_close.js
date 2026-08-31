import moment from 'moment-timezone';

global.programaciones = global.programaciones || { cierres: {}, aperturas: {} };

const phoneToTz = {
    '504': 'America/Tegucigalpa', '52': 'America/Mexico_City', '54': 'America/Argentina/Buenos_Aires',
    '57': 'America/Bogota', '51': 'America/Lima', '56': 'America/Santiago', '34': 'Europe/Madrid',
    '58': 'America/Caracas', '593': 'America/Guayaquil', '502': 'America/Guatemala', '503': 'America/El_Salvador',
    '505': 'America/Managua', '506': 'America/Costa_Rica', '507': 'America/Panama', '591': 'America/La_Paz',
    '595': 'America/Asuncion', '598': 'America/Montevideo', '53': 'America/Havana', '1809': 'America/Santo_Domingo',
    '1829': 'America/Santo_Domingo', '1849': 'America/Santo_Domingo', '1787': 'America/Puerto_Rico',
    '1939': 'America/Puerto_Rico', '240': 'Africa/Malabo', '1': 'America/New_York', '55': 'America/Sao_Paulo',
    '44': 'Europe/London', '33': 'Europe/Paris', '49': 'Europe/Berlin', '39': 'Europe/Rome',
    '351': 'Europe/Lisbon', '7': 'Asia/Moscow', '86': 'Asia/Shanghai', '81': 'Asia/Tokyo',
    '82': 'Asia/Seoul', '91': 'Asia/Kolkata', '62': 'Asia/Jakarta', '63': 'Asia/Manila',
    '61': 'Australia/Sydney', '20': 'Africa/Cairo', '27': 'Africa/Johannesburg', '971': 'Asia/Dubai',
    '966': 'Asia/Riyadh', '90': 'Europe/Istanbul'
};

function getTz(jid) {
    const number = jid.split('@')[0];
    for (const prefix in phoneToTz) {
        if (number.startsWith(prefix)) return phoneToTz[prefix];
    }
    return 'America/Mexico_City';
}

function parseTiempo(entrada, tz) {
    entrada = entrada.toLowerCase().replace(/\s/g, '');
    const ahora = moment().tz(tz);
    if (/^\d{1,2}:\d{2}(am|pm)?$/.test(entrada)) {
        let match = entrada.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
        let horas = parseInt(match[1]);
        const minutos = parseInt(match[2]);
        const p = match[3];
        if (p === 'pm' && horas < 12) horas += 12;
        if (p === 'am' && horas === 12) horas = 0;
        let objetivo = moment.tz(tz).set({ hour: horas, minute: minutos, second: 0, millisecond: 0 });
        if (objetivo.isBefore(ahora)) objetivo.add(1, 'days');
        return { ms: objetivo.diff(ahora), fecha: objetivo };
    }
    const duracionMatch = entrada.match(/^(\d+)(h|m|s)$/);
    if (duracionMatch) {
        const valor = parseInt(duracionMatch[1]);
        const unidad = duracionMatch[2];
        const ms = valor * { 'h': 3600000, 'm': 60000, 's': 1000 }[unidad];
        return { ms, fecha: moment().tz(tz).add(ms, 'ms') };
    }
    return null;
}

function programarCierre(chatId, ms, conn) {
    if (global.programaciones.cierres[chatId]) clearTimeout(global.programaciones.cierres[chatId]);
    global.programaciones.cierres[chatId] = setTimeout(async () => {
        await conn.groupSettingUpdate(chatId, 'announcement');
        await conn.sendMessage(chatId, { text: `> ღ *CIERRE AUTOMÁTICO*\nCumplido horario programado.` });
        delete global.programaciones.cierres[chatId];
    }, ms);
}

function programarApertura(chatId, ms, conn) {
    if (global.programaciones.aperturas[chatId]) clearTimeout(global.programaciones.aperturas[chatId]);
    global.programaciones.aperturas[chatId] = setTimeout(async () => {
        await conn.groupSettingUpdate(chatId, 'not_announcement');
        await conn.sendMessage(chatId, { text: `> ⍰ *APERTURA AUTOMÁTICA*\nCumplido horario programado.` });
        delete global.programaciones.aperturas[chatId];
    }, ms);
}

export const groupControlCommand = {
    category: 'group',
    commands: {
        grupo: {
            name: 'grupo',
            alias: ['cerrargrupo', 'abrirgrupo', 'abrir', 'cerrar', 'open', 'close','vamoscerrandoelpapoi'],
            group: true,
            admin: true,
            botAdmin: true,
            run: async (m, { conn, args, command, usedPrefix }) => {
                if (!m.isGroup) return;

                const chatId = m.chat;

                const groupMetadata = await conn.groupMetadata(chatId).catch(e => ({}));
                const isAnnounce = groupMetadata.announce;

                const tz = getTz(m.sender);
                const horaActual = moment().tz(tz).format('hh:mm A');

                if (command === 'cerrar' || command === 'close') {
                    if (args[0] && args[0].toLowerCase() !== 'cancelar') {
                        const minutos = parseInt(args[0]);
                        if (isNaN(minutos) || minutos < 1 || minutos > 120) {
                            return m.reply(`❌ Ingresa un número de minutos válido (Entre 1 y 120).\n\n*Ejemplo:* ${usedPrefix}${command} 30`);
                        }
                        const ms = minutos * 60000;
                        const fechaDestino = moment().tz(tz).add(ms, 'ms');
                        const horaDestino = fechaDestino.format('hh:mm:ss A');

                        programarCierre(chatId, ms, conn);
                        return m.reply(`> ♛ *CIERRE PROGRAMADO*\nEn: ${minutos} minuto(s)\nEjecución: ${horaDestino}\nPaís: ${tz}`);
                    }

                    if (!args[0]) {
                        if (isAnnounce) return m.reply(`* ⚠✰ *AVISO:* El grupo ya se encuentra *CERRADO*.\n> Solo admins.`);
                        await conn.groupSettingUpdate(chatId, 'announcement');
                        return conn.sendMessage(chatId, { text: `✰ *GRUPO CONFIGURADO*\n\nAcción: Cierre inmediato\nEstado: Solo Admins\nHora: ${horaActual} (${tz})` });
                    }
                }

                if (command === 'abrir' || command === 'open') {
                    if (args[0] && args[0].toLowerCase() !== 'cancelar') {
                        const minutos = parseInt(args[0]);
                        if (isNaN(minutos) || minutos < 1 || minutos > 120) {
                            return m.reply(`❌ Ingresa un número de minutos válido (Entre 1 y 120).\n\n*Ejemplo:* ${usedPrefix}${command} 30`);
                        }
                        const ms = minutos * 60000;
                        const fechaDestino = moment().tz(tz).add(ms, 'ms');
                        const horaDestino = fechaDestino.format('hh:mm:ss A');

                        programarApertura(chatId, ms, conn);
                        return m.reply(`> ♛ *APERTURA PROGRAMADA*\nEn: ${minutos} minuto(s)\nEjecución: ${horaDestino}\nPaís: ${tz}`);
                    }

                    if (!args[0]) {
                        if (!isAnnounce && isAnnounce !== undefined) return m.reply(`* ⚠✰ *AVISO:* El grupo ya se encuentra *ABIERTO*.\n> Todos participan.`);
                        await conn.groupSettingUpdate(chatId, 'not_announcement');
                        return conn.sendMessage(chatId, { text: `✰ *GRUPO CONFIGURADO*\n\nAcción: Apertura inmediata\nEstado: Todos\nHora: ${horaActual} (${tz})` });
                    }
                }

                if (args[0] === 'cancelar') {
                    const c = global.programaciones.cierres[chatId];
                    const a = global.programaciones.aperturas[chatId];
                    if (c) { clearTimeout(c); delete global.programaciones.cierres[chatId]; }
                    if (a) { clearTimeout(a); delete global.programaciones.aperturas[chatId]; }
                    return m.reply('✰ *OPERACIÓN CANCELADA*');
                }

                if (!args[0]) {
                    return m.reply(`⚙ *PANEL DE CONTROL*\n\n- .abrir | .cerrar\n- .cerrar 30 (minutos)\n- .abrir 30 (minutos)\n- .cerrargrupo 10:00pm\n- .abrirgrupo 1h\n\n*Ubicación:* ${tz}\n*Hora:* ${horaActual}`);
                }

                const resultado = parseTiempo(args[0], tz);
                if (!resultado) return m.reply('Ƀ͢Ƀ Formato inválido: 10:00pm, 1h, 30m.');

                const { ms, fecha } = resultado;
                const horaDestino = fecha.format('hh:mm:ss A');

                if (command === 'cerrargrupo') {
                    programarCierre(chatId, ms, conn);
                    return m.reply(`> ♛ *CIERRE PROGRAMADO*\nEjecución: ${horaDestino}\nPaís: ${tz}`);
                }

                if (command === 'abrirgrupo') {
                    programarApertura(chatId, ms, conn);
                    return m.reply(`> ♛ *APERTURA PROGRAMADA*\nEjecución: ${horaDestino}\nPaís: ${tz}`);
                }
            }
        }
    }
};
