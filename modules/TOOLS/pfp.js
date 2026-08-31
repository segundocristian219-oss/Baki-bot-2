export const pfpCommand = {
    category: 'tools',
    commands: {
        pfp: {
            name: 'pfp',
            alias: ['pfp', 'perfil'],
            run: async (m, { conn, text }) => {
                const who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.sender);

                const pp = await conn.profile(who, 'image');

                await conn.sendMessage(m.chat, {
                    image: { url: pp },
                    caption: `*Foto de perfil de:* @${who.split('@')[0]}`,
                    mentions: [who]
                }, { quoted: m });
            }
        }
    }
};