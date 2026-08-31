import { jidNormalizedUser } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

export const stopSubModule = {
    category: 'owner',
    commands: {
        stops: {
            name: 'stops',
            owner: true,
            async before(m, { conn }) {
                global.resetSession = global.resetSession || {};
                const sender = m.sender;
                const txt = (m.text || "").trim().toLowerCase();

                if (!global.resetSession[sender]) return false;
                if (!/^(si|no)$/i.test(txt)) return false;

                const sessionPath = path.join(process.cwd(), 'jadibts');
                const targetNum = global.resetSession[sender];

                if (txt === 'no') {
                    await conn.sendMessage(m.chat, { text: '❌ Operación cancelada.' }, { quoted: m });
                    delete global.resetSession[sender];
                    return true;
                }

                if (txt === 'si') {
                    const files = [
                        `${targetNum}.sqlite`,
                        `${targetNum}.sqlite-shm`,
                        `${targetNum}.sqlite-wal`
                    ];

                    if (global.conns && global.conns.has(targetNum)) {
                        try {
                            const subConn = global.conns.get(targetNum);
                            if (subConn?.ws) subConn.ws.close();
                            global.conns.delete(targetNum);
                        } catch (e) { console.error(e); }
                    }

                    let log = `┏━━ 「 SESIÓN ELIMINADA 」 ━━┓\n┃\n┃ ✅ Confirmado\n┃ 🤖 Objetivo: ${targetNum}\n`;

                    for (const file of files) {
                        const fullPath = path.join(sessionPath, file);
                        if (fs.existsSync(fullPath)) {
                            try {
                                fs.unlinkSync(fullPath);
                                log += `┃ 🗑️ Borrado: ${file}\n`;
                            } catch (e) { console.error(e); }
                        }
                    }

                    log += `┃\n┃ ✨ Estado: Limpieza exitosa\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
                    await conn.sendMessage(m.chat, { text: log }, { quoted: m });

                    delete global.resetSession[sender];
                    return true;
                }
            },
            run: async (m, { conn, text }) => {
                let targetNum;
                if (text && text.trim()) {
                    targetNum = text.replace(/[^0-9]/g, '');
                } else {
                    targetNum = jidNormalizedUser(m.sender).split('@')[0];
                }

                const sessionFile = path.join(process.cwd(), 'jadibts', `${targetNum}.sqlite`);

                if (!fs.existsSync(sessionFile)) {
                    return await conn.sendMessage(m.chat, { text: '❌ No se encontró el archivo de sesión para: ' + targetNum }, { quoted: m });
                }

                global.resetSession = global.resetSession || {};
                global.resetSession[m.sender] = targetNum;

                await conn.sendMessage(m.chat, { 
                    text: `⚠️ ¿Confirmas eliminar la sesión del número *${targetNum}*?\n\nResponde *si* o *no*.` 
                }, { quoted: m });
            }
        }
    }
};
