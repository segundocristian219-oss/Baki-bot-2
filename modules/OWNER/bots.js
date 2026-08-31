import { listSubBots } from '../../core/s/serbot-bridge.js';

export const botsModule = {
    category: 'owner',
    commands: {
        botss: {
            name: 'botss',
            alias: ['subbotss'],
            rowner: true,
            run: async (m, { conn }) => {
                const subbotsMap = new Map();

                if (global.conns && global.conns.size > 0) {
                    for (const [id, sock] of global.conns.entries()) {
                        if (sock.user && sock.user.id) {
                            const fullJid = sock.user.id;
                            const number = fullJid.split(':')[0].split('@')[0];
                            const name = sock.user.name || 'Sub-Bot';
                            subbotsMap.set(number, { jid: fullJid, name, number });
                        }
                    }
                }

                try {
                    const bridgeBots = await listSubBots();
                    if (Array.isArray(bridgeBots)) {
                        for (const bot of bridgeBots) {
                            if (bot && bot.jid) {
                                const fullJid = bot.jid;
                                const number = fullJid.split(':')[0].split('@')[0];
                                const name = bot.name || 'Sub-Bot';
                                if (!subbotsMap.has(number)) {
                                    subbotsMap.set(number, { jid: fullJid, name, number });
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error al consultar listSubBots:', e.message);
                }

                if (subbotsMap.size === 0) {
                    return m.reply('❌ No hay sub-bots activos en este momento.');
                }

                let txt = ` ★᭄ꦿ᭄ꦿ *SUB-BOTS ACTIVOS* ★᭄ꦿ᭄ꦿ\n\n`;
                txt += `➥ Total: ${subbotsMap.size}\n\n`;

                let i = 1;
                const mentionedJid = [];

                for (const { jid, name, number } of subbotsMap.values()) {
                    txt += `╭ᯓ *${i++}.* wa.me/${number} \n╰┄✜ (${name})\n\n`;
                    mentionedJid.push(jid);
                }

                const thumb = typeof global.img === 'function' ? global.img(conn) : (typeof img === 'function' ? img(conn) : 'https://dix.lat');

                await conn.sendMessage(m.chat, { 
                    image: { url: thumb },
                    caption: txt,
                    contextInfo: { 
                        mentionedJid: mentionedJid 
                    }
                }, { quoted: m });
            }
        }
    }
};
