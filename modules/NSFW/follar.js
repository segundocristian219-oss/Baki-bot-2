const moduleData = {
    nsfw: {
        category: 'NSFW',
        commands: {
            follar: {
                name: 'follar',
                alias: ['coger'],
                desc: 'Comando NSFW para simular una acción con otro usuario.',
                run: async (m, { conn }) => {
                    if (!m.isGroup) {
                        return conn.sendMessage(m.chat, { text: '❌ Este comando solo puede usarse en grupos.' }, { quoted: m });
                    }

                    let user = m.mentionedJid?.[0] || m.quoted?.sender;

                    if (!user) {
                        return conn.sendMessage(m.chat, { text: '⚠️ Debes mencionar a un usuario.' }, { quoted: m });
                    }

                    await conn.sendMessage(
                        m.chat,
                        {
                            text: `😈 Has follado a @${user.split('@')[0]} a cuatro patas y la has dejado sin energía 😈`,
                            contextInfo: { mentionedJid: [user] }
                        },
                        { quoted: m }
                    );
                }
            }
        }
    }
};

export default moduleData;
