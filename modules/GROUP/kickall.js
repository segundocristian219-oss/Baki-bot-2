import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../../core/identifier.js';

export const kickallCommand = {
    category: 'group',
    commands: {
        kickall: {
            name: 'kickall',
            alias: ['eliminartodos', 'purgar'],
            admin: true,
            group: true,
            botAdmin: true,
            async before(m, { conn }) {
                global.kickAllSession = global.kickAllSession || {};
                const chatID = m.chat;

                if (!global.kickAllSession[chatID]) return false;
                if (global.kickAllSession[chatID].admin !== m.sender) return false;

                const txt = (m.text || "").trim().toLowerCase();
                if (!/^(si|no)$/i.test(txt)) return false;

                if (txt === 'no') {
                    await conn.sendMessage(m.chat, { text: '> ❌ La acción de eliminar todos los usuarios del grupo fue cancelada.' }, { quoted: m });
                    delete global.kickAllSession[chatID];
                    return true;
                }

                if (txt === 'si') {
                    const botJid = jidNormalizedUser(conn.user.id);

                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participants = groupMetadata.participants || [];

                    const realParticipants = await Promise.all(
                        participants.map(async (p) => {
                            return await getRealJid(conn, p.id, m);
                        })
                    );

                    const users = realParticipants.filter(id => id !== botJid && id !== m.sender);

                    if (users.length === 0) {
                        await conn.sendMessage(m.chat, { text: '> ✎ ɪɴғᴏ: No hay usuarios para eliminar.' }, { quoted: m });
                        delete global.kickAllSession[chatID];
                        return true;
                    }

                    await conn.sendMessage(m.chat, { text: `> ⚠️ *INICIANDO LIMPIEZA*\n\nEliminando ${users.length} usuarios...` }, { quoted: m });

                    for (let i = 0; i < users.length; i += 5) {
                        const batch = users.slice(i, i + 5);
                        try {
                            await conn.groupParticipantsUpdate(m.chat, batch, 'remove');
                        } catch (e) {
                            console.error(e);
                        }
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }

                    await conn.sendMessage(m.chat, { 
                        text: `> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✅ ʟɪᴍᴘɪᴇᴢᴀ ᴇxɪᴛᴏsᴀ\n> ┃ Todos los usuarios han\n> ┃ sido removidos.\n> ┗━━━━━━━━━━━━━━━━━━┛` 
                    });

                    delete global.kickAllSession[chatID];
                    return true;
                }
            },
            run: async (m, { conn }) => {
                global.kickAllSession = global.kickAllSession || {};
                const chatID = m.chat;
                global.kickAllSession[chatID] = { admin: m.sender };

                const targetNum = m.sender.split('@')[0];

                await conn.sendMessage(m.chat, {
                    text: `⚠️ *CONFIRMACIÓN DE SEGURIDAD*\n\n@${targetNum}, ¿Estás seguro de que quieres eliminar a todos los usuarios del grupo?\n\nResponde con *si* para confirmar o *no* para cancelar.`,
                    mentions: [m.sender]
                }, { quoted: m });
            }
        }
    }
};