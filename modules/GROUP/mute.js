import { getRealJid } from '../../core/identifier.js';

export const muteCommand = {
    category: 'group',
    commands: {
        mute: {
            name: 'mute',
            alias: ['unmute', 'mutar', 'silenciar'],
            admin: true,
            botAdmin: true,
            group: true,
            run: async (m, { conn, command, text }) => {
                let cleanedText = text ? text.replace(/[^0-9]/g, '') : '';
                let s = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : cleanedText ? cleanedText + '@s.whatsapp.net' : null;

                let who = await getRealJid(conn, s, m);

                if (!who || who === '@s.whatsapp.net' || who === '@lid' || (!who.endsWith('@s.whatsapp.net') && !who.endsWith('@lid'))) {
                    return m.reply(`*♛ Menciona o responde a alguien*`);
                }

                const ownersJids = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net');
                const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                
                const realBotId = await getRealJid(conn, botId, m);
                const realOwnersJids = await Promise.all(ownersJids.map(jid => getRealJid(conn, jid, m)));

                if (realOwnersJids.includes(who)) return m.reply('> ╰❒ No puedo mutear a mi creador.');
                if (who === realBotId) return m.reply('> ╰❒ No puedo mutearme a mí mismo.');

                const isMuting = ['mute', 'mutar', 'silenciar'].includes(command);

                if (isMuting) {
                    await global.Chat.findOneAndUpdate(
                        { id: m.chat },
                        { $addToSet: { mutos: who } } 
                    );
                } else {
                    await global.Chat.findOneAndUpdate(
                        { id: m.chat },
                        { $pull: { mutos: who } } 
                    );
                }

                const status = isMuting ? 'silenciado' : 'desmutado';
                await conn.sendMessage(m.chat, { 
                    text: `> ♛ *Usuario ${status} correctamente.*`, 
                    mentions: [who] 
                }, { quoted: m });
            }
        }
    }
};
