import { getRealJid } from '../../core/identifier.js';

const moduleData = {
    fun: {
        category: 'Diversión',
        commands: {
            funar: {
                name: 'funar',
                alias: ['cancelar', 'reportar'],
                group: true,
            admin: true,
                run: async (m, { conn }) => {
                    try {
                        let cleanedText = m.text ? m.text.replace(/[^0-9]/g, '') : '';
                        let s = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : cleanedText ? cleanedText + '@s.whatsapp.net' : null;

                        let who = await getRealJid(conn, s, m);

                        if (!who || who === '@s.whatsapp.net' || who === '@lid' || (!who.endsWith('@s.whatsapp.net') && !who.endsWith('@lid'))) {
                            return conn.sendMessage(m.chat, { text: '⚠️ Menciona o responde a la persona que vas a funar.\n\n*Uso:* `.funar @usuario <motivo>`' }, { quoted: m });
                        }

                        const ownersJids = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net');
                        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                        const realBotId = await getRealJid(conn, botId, m);
                        const realOwnersJids = await Promise.all(ownersJids.map(jid => getRealJid(conn, jid, m)));

                        if (realOwnersJids.includes(who)) return m.reply('> ╰❒ No puedes funar a mi creador.');
                        if (who === realBotId) return m.reply('> ╰❒ No puedes funarme a mí.');

                        let args = m.text.trim().split(/ +/).slice(1);
                        let razon = args.join(' ').replace(/@\d+/g, '').trim();

                        const motivosAleatorios = [
                            'Uso no autorizado de stickers feos',
                            'No saludar al entrar al chat',
                            'Dejar en visto al grupo',
                            'Robar memes sin dar créditos',
                            'Enviar audios de más de 3 minutos'
                        ];

                        if (!razon) {
                            razon = motivosAleatorios[Math.floor(Math.random() * motivosAleatorios.length)];
                        }

                        let numero = who.split('@')[0];

                        await global.Chat.findOneAndUpdate(
                            { id: m.chat },
                            { $addToSet: { mutos: who } }
                        );

                        setTimeout(async () => {
                            const chatData = await global.Chat.findOne({ id: m.chat });
                            if (chatData && chatData.mutos && chatData.mutos.includes(who)) {
                                await global.Chat.findOneAndUpdate(
                                    { id: m.chat },
                                    { $pull: { mutos: who } }
                                );
                                await conn.sendMessage(m.chat, { 
                                    text: `🕊️ *LA FUNA HA EXPIRADO*\n\nEl usuario @${numero} ha cumplido sus 5 minutos de silencio y fue desmuteado.`,
                                    mentions: [who]
                                });
                            }
                        }, 5 * 60 * 1000);

                        let mensaje = `🚨 *REPORTE MASIVO EN PROCESO* 🚨\n\n` +
                                      `⚠️ Realizando reporte masivo al número +${numero}...\n\n` +
                                      `👤 *Usuario objetivo:* @${numero}\n` +
                                      `📋 *Motivo de la funa:* ${razon}\n` +
                                      `🔇 *Castigo:* Silenciado por 5 minutos.\n` +
                                      `📊 *Estado:* Enviando 50/50 reportes a soporte...\n\n` +
                                      `───────────────────\n` +
                                      `🕊️ Usa \`.cancelfuna @usuario\` para retirar la funa y desmutearlo.`;

                        await conn.sendMessage(m.chat, { 
                            text: mensaje, 
                            contextInfo: { mentionedJid: [who] } 
                        }, { quoted: m });

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error al procesar la funa: ${err.message}` }, { quoted: m });
                    }
                }
            },
            cancelfuna: {
                name: 'cancelfuna',
                alias: ['unfuna', 'desfunar', 'perdonar'],
                group: true,
                run: async (m, { conn }) => {
                    try {
                        let cleanedText = m.text ? m.text.replace(/[^0-9]/g, '') : '';
                        let s = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : cleanedText ? cleanedText + '@s.whatsapp.net' : null;

                        let who = await getRealJid(conn, s, m);

                        if (!who || who === '@s.whatsapp.net' || who === '@lid' || (!who.endsWith('@s.whatsapp.net') && !who.endsWith('@lid'))) {
                            return conn.sendMessage(m.chat, { text: '⚠️ Menciona o responde a la persona a la que le quitarás la funa.' }, { quoted: m });
                        }

                        let numero = who.split('@')[0];

                        await global.Chat.findOneAndUpdate(
                            { id: m.chat },
                            { $pull: { mutos: who } }
                        );

                        let mensaje = `🕊️ *FUNA CANCELADA* 🕊️\n\n` +
                                      `Se le ha otorgado el perdón a @${numero}.\n` +
                                      `🔊 *Estado:* Usuario desmuteado correctamente.`;

                        await conn.sendMessage(m.chat, { 
                            text: mensaje, 
                            contextInfo: { mentionedJid: [who] } 
                        }, { quoted: m });

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error al cancelar la funa: ${err.message}` }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
