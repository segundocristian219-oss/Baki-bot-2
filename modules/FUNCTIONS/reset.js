import { jidNormalizedUser } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

export const resetCommand = {
    category: 'main',
    commands: {
        stop: {
            name: 'stop',
            alias: ['reestablecer', 'borrarsesion'],
            async before(m, { conn }) {
                global.resetSession = global.resetSession || {};
                const gameId = `${m.chat}-${m.sender}`;
                const txt = (m.text || "").trim().toLowerCase();

                if (!global.resetSession[gameId]) return false;
                if (!/^(si|no)$/i.test(txt)) return false;

                const senderId = jidNormalizedUser(m.sender);
                const targetNum = senderId.split('@')[0];
                const sessionPath = './jadibts/';

                if (txt === 'no') {
                    await conn.sendMessage(m.chat, { text: '❌ Solicitud de eliminación rechazada.' }, { quoted: m });
                    delete global.resetSession[gameId];
                    return true;
                }

                if (txt === 'si') {
                    const filesToDelete = [
                        `${sessionPath}${targetNum}.sqlite`,
                        `${sessionPath}${targetNum}.sqlite-shm`,
                        `${sessionPath}${targetNum}.sqlite-wal`
                    ];

                    if (global.conns && global.conns.has(targetNum)) {
                        try {
                            const subConn = global.conns.get(targetNum);
                            subConn.ws.close();
                            global.conns.delete(targetNum);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    let report = `┏━━ 「 SESIÓN ELIMINADA 」 ━━┓\n┃\n┃ ✅ Solicitud confirmada\n`;
                    let deletedAny = false;

                    for (const file of filesToDelete) {
                        if (fs.existsSync(file)) {
                            try {
                                fs.unlinkSync(file);
                                deletedAny = true;
                                report += `┃ 🗑️ Borrado: ${path.basename(file)}\n`;
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }

                    report += `┃\n┃ ✨ Estado: Limpieza exitosa\n┃ 🤖 Nota: Ya puedes volver a\n┃ iniciar sesión como sub-bot.\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

                    await conn.sendMessage(m.chat, {
                        image: { url: global.img() },
                        caption: report,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                    delete global.resetSession[gameId];
                    return true;
                }
            },
            run: async (m, { conn }) => {
                const senderId = jidNormalizedUser(m.sender);
                const targetNum = senderId.split('@')[0];
                const sessionFile = `./jadibts/${targetNum}.sqlite`;

                if (!fs.existsSync(sessionFile)) {
                    return await conn.sendMessage(m.chat, { 
                        text: '❌ Tú no tienes una conexión como sub-bot activa en nuestros registros.' 
                    }, { quoted: m });
                }

                global.resetSession = global.resetSession || {};
                const gameId = `${m.chat}-${m.sender}`;
                global.resetSession[gameId] = true;

                await conn.sendMessage(m.chat, {
                    text: `⚠️ *CONFIRMACIÓN DE SEGURIDAD*\n\n@${targetNum}, ¿Estás seguro de que quieres eliminar tu sesión de sub-bot?\n\nResponde con *si* para confirmar o *no* para cancelar (sin prefijos).`,
                    mentions: [m.sender]
                }, { quoted: m });
            }
        }
    }
};
