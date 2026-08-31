import { getRealJid } from '../../core/identifier.js';

export const topCommand = {
    category: 'fun',
    commands: {
        top: {
            name: 'top',
            alias: ['topg'],
            run: async (m, { conn, text, participants }) => {
                if (!m.isGroup) return;

                let groupParticipants = participants;
                if (!groupParticipants || groupParticipants.length === 0) {
                    try {
                        const metadata = await conn.groupMetadata(m.chat);
                        groupParticipants = metadata?.participants || [];
                    } catch (err) {
                        console.error("Error al obtener metadatos en comando top:", err);
                        return;
                    }
                }

                if (!groupParticipants || groupParticipants.length === 0) return;

                const args = text.trim().split(/\s+/);
                let limit = 10;
                let topReason = text.trim();

                if (args[0] && !isNaN(args[0]) && parseInt(args[0]) > 0) {
                    limit = Math.min(10, parseInt(args[0]));
                    topReason = args.slice(1).join(' ').trim();
                }

                if (!topReason) topReason = 'usuarios aleatorios';

                let shuffled = groupParticipants
                    .map(p => p.id)
                    .sort(() => 0.5 - Math.random());

                const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

                const realParticipants = await Promise.all(
                    selected.map(async (id) => {
                        return await getRealJid(conn, id, m);
                    })
                );

                let txt = `> ✰ *TOP ${limit} ${topReason.toUpperCase()}*\n> ───────────────\n`;

                realParticipants.forEach((jid, i) => {
                    txt += ` ${i + 1}. @${jid.split('@')[0]}\n`;
                });

                txt += `> ───────────────`;

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
