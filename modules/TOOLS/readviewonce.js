import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';

export const readOnceCommand = {
    category: 'tools',
    commands: {
        readviewonce: {
            name: 'readviewonce',
            alias: ['ver', 'read', 'vv'],
            run: async (m, { conn }) => {
                const q = m.quoted ? m.quoted : m;
                const msg = q.msg || q.message?.viewOnceMessageV2?.message || q.message?.viewOnceMessage?.message || q.message;

                if (!msg) return;

                const type = q.mtype || Object.keys(msg)[0];

                if (!/image|video|audio/.test(type)) {
                    return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un mensaje de imagen, video o audio.');
                }

                try {
                    await m.react('👁️');

                    const buffer = await downloadMediaMessage(
                        q,
                        'buffer',
                        {},
                        { 
                            reusedStaticNetworkKey: true,
                            logger: pino({ level: 'silent' }) 
                        }
                    );

                    if (!buffer) {
                        await m.react('❌');
                        return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo obtener el archivo.');
                    }

                    const originalCaption = msg?.caption || q?.text || '';
                    const caption = originalCaption ? `♕ 𝗧𝗘𝗫𝗧𝗢: ${originalCaption}` : `❯❯ Contenido revelado`;
                    const options = { quoted: m };

                    if (/video/.test(type)) {
                        await conn.sendMessage(m.chat, { video: buffer, caption }, options);
                    } else if (/image/.test(type)) {
                        await conn.sendMessage(m.chat, { image: buffer, caption }, options);
                    } else if (/audio/.test(type)) {
                        await conn.sendMessage(m.chat, { 
                            audio: buffer, 
                            mimetype: 'audio/mp4', 
                            ptt: true 
                        }, options);
                    }

                    await m.react('✅');

                } catch (e) {
                    await m.react('❌');
                    m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo procesar el archivo.');
                }
            }
        }
    }
};