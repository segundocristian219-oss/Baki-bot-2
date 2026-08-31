import { listSubBots } from '../../core/s/serbot-bridge.js';

export const botsCommand = {
    category: 'main',
    commands: {
        bots: {
            name: 'bots',
            alias: ['subbots'],
            run: async (m, { conn }) => {
                let subbots = [];
                try {
                    subbots = await listSubBots();
                } catch (e) {
                    return m.reply('❌ No se pudo consultar el proceso de subbots: ' + e.message);
                }

                if (subbots.length === 0) {
                    return m.reply('❌ No hay sub-bots activos en este momento.');
                }

                let txt = ` ★᭄ꦿ᭄ꦿ *SUB-BOTS ACTIVOS* ★᭄ꦿ᭄ꦿ\n\n`;
                txt += `➥ Total: ${subbots.length}\n\n`;

                let i = 1;
                const mentionedJid = [];

                for (const { jid, name } of subbots) {
                    const number = jid.split(':')[0];
                    const maskedNumber = number.slice(0, 5) + '...' + number.slice(-2);

                    txt += `╭ᯓ *${i++}.* ${maskedNumber} \n╰┄✜ (${name || 'Sub-Bot'})\n\n`;
                    mentionedJid.push(jid);
                }

                await conn.sendMessage(m.chat, {
                    image: { url: global.img(conn) },
                    caption: txt,
                    contextInfo: {
                        mentionedJid: mentionedJid
                    }
                }, { quoted: m });
            }
        }
    }
};
