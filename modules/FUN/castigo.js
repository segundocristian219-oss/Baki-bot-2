import { getRealJid } from '../../core/identifier.js';

const moduleData = {
    fun: {
        category: 'Diversión',
        commands: {
            castigo: {
                name: 'castigo',
                alias: ['penitencia', 'reto'],
                group: true,
                            admin: true,
                run: async (m, { conn }) => {
                    try {
                        let cleanedText = m.text ? m.text.replace(/[^0-9]/g, '') : '';
                        let s = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : cleanedText ? cleanedText + '@s.whatsapp.net' : null;

                        let who = await getRealJid(conn, s, m);

                        if (!who || who === '@s.whatsapp.net' || who === '@lid' || (!who.endsWith('@s.whatsapp.net') && !who.endsWith('@lid'))) {
                            return conn.sendMessage(m.chat, { text: '⚠️ Menciona o responde al usuario que recibirá el castigo.\n\n*Uso:* `.castigo @usuario`' }, { quoted: m });
                        }

                        const ownersJids = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net');
                        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                        const realBotId = await getRealJid(conn, botId, m);
                        const realOwnersJids = await Promise.all(ownersJids.map(jid => getRealJid(conn, jid, m)));

                        if (realOwnersJids.includes(who)) return m.reply('> ╰❒ No puedes castigar a mi creador.');
                        if (who === realBotId) return m.reply('> ╰❒ No puedes castigarme a mí.');

                        const retos = [
                            'Declararse fan número 1 de los gatitos en el grupo.',
                            'Admitir que perdió limpiamente en los minijuegos.',
                            'Enviar 3 stickers de caritas felices seguidos.',
                            'Prometer no volver a perder en el Ahorcado.'
                        ];

                        let retoAsignado = retos[Math.floor(Math.random() * retos.length)];
                        let numero = who.split('@')[0];

                        await global.Chat.findOneAndUpdate(
                            { id: m.chat },
                            { $addToSet: { mutos: who } }
                        );

                        let mensaje = `⚖️ *TRIBUNAL DEL CHAT - CASTIGO APLICADO* ⚖️\n\n` +
                                      `👤 *Usuario penalizado:* @${numero}\n` +
                                      `🔇 *Estado:* Silenciado en el chat.\n` +
                                      `📜 *Penitencia requerida:* ${retoAsignado}\n\n` +
                                      `───────────────────\n` +
                                      `Para desmutearlo, un administrador o el ejecutor debe usar:\n` +
                                      `\`.descastigar @${numero}\``;

                        await conn.sendMessage(m.chat, { 
                            text: mensaje, 
                            contextInfo: { mentionedJid: [who] } 
                        }, { quoted: m });

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error al aplicar el castigo: ${err.message}` }, { quoted: m });
                    }
                }
            },
            descastigar: {
                name: 'descastigar',
                alias: ['liberar', 'perdonarcastigo'],
                group: true,
                run: async (m, { conn }) => {
                    try {
                        let cleanedText = m.text ? m.text.replace(/[^0-9]/g, '') : '';
                        let s = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : cleanedText ? cleanedText + '@s.whatsapp.net' : null;

                        let who = await getRealJid(conn, s, m);

                        if (!who || who === '@s.whatsapp.net' || who === '@lid' || (!who.endsWith('@s.whatsapp.net') && !who.endsWith('@lid'))) {
                            return conn.sendMessage(m.chat, { text: '⚠️ Menciona o responde a la persona que vas a descastigar.' }, { quoted: m });
                        }

                        let numero = who.split('@')[0];

                        await global.Chat.findOneAndUpdate(
                            { id: m.chat },
                            { $pull: { mutos: who } }
                        );

                        let mensaje = `🔔 *CASTIGO FINALIZADO* 🔔\n\n` +
                                      `El usuario @${numero} ha cumplido su penitencia o ha sido perdonado.\n` +
                                      `🔊 *Estado:* Desmuteado correctamente.`;

                        await conn.sendMessage(m.chat, { 
                            text: mensaje, 
                            contextInfo: { mentionedJid: [who] } 
                        }, { quoted: m });

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error al descastigar: ${err.message}` }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
