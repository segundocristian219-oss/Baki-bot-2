import { getRealJid } from '../../core/identifier.js';

export const parejasCommand = {
    category: 'fun',
    commands: {
        formarpareja: {
            name: 'formarpareja',
            alias: ['parejas', 'ship'],
            run: async (m, { conn, participants }) => {
                let shuffled = participants
                    .map(p => p.id)
                    .sort(() => 0.5 - Math.random());

                if (shuffled.length < 2) return conn.reply(m.chat, '> ⚠ *No hay suficientes participantes.*', m);

                const limit = Math.min(6, shuffled.length - (shuffled.length % 2));
                const selected = shuffled.slice(0, limit);

                const realParticipants = await Promise.all(
                    selected.map(async (id) => {
                        return await getRealJid(conn, id, m);
                    })
                );

                let txt = `> ┏━━━〔 ꜰᴏʀᴍᴀɴᴅᴏ ᴘᴀʀᴇᴊᴀs 〕━━━┓\n> ┃\n`;

                for (let i = 0; i < realParticipants.length; i += 2) {
                    let user1 = realParticipants[i];
                    let user2 = realParticipants[i + 1];
                    let love = Math.floor(Math.random() * (100 - 20 + 1)) + 20;

                    txt += `> ┃ 🫂 @${user1.split('@')[0]} x @${user2.split('@')[0]}\n`;
                    txt += `> ┃ 💡 Química: ${love}%\n> ┃\n`;
                }

                txt += `> ┗━━━━━━━━━━━━━━━━━━━━┛`;

                return conn.sendMessage(m.chat, {
                    text: txt,
                    contextInfo: {
                        mentionedJid: realParticipants,
                        groupMentions: [],
                        remoteJidAlt: m.chat
                    }
                }, { quoted: m });
            }
        }
    }
};
