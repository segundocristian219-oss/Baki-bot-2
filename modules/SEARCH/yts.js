import yts from 'yt-search';

export const ytSearchCommand = {
    category: 'search',
    commands: {
        ytsearch: {
            name: 'ytsearch',
            alias: ['yts'],
            run: async (m, { conn, text, command }) => {
                if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término]`);

                m.react('🔍');

                try {
                    const search = await yts(text);
                    const vids = search.videos.slice(0, 3);

                    if (vids.length === 0) {
                        m.react('❌');
                        return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se detectaron resultados.`);
                    }

                    let mensaje = `❯❯ 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n\n`;

                    vids.forEach((vid, index) => {
                        mensaje += `*# RESULTADO ${index + 1}*\n` +
                                   `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${vid.title}\n` +
                                   `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${vid.timestamp}\n` +
                                   `❖ 𝗩𝗜𝗦𝗧𝗔𝗦: ${vid.views.toLocaleString()}\n` +
                                   `❖ 𝗔𝗨𝗧𝗢𝗥: ${vid.author.name}\n` +
                                   `❖ 𝗘𝗡𝗟𝗔𝗖𝗘: ${vid.url}\n\n`;
                    });

                    await conn.sendMessage(m.chat, {
                        product: {
                            productImage: {
                                url: vids[0].thumbnail
                            },
                            title: "YOUTUBE SEARCH",
                            description: `Resultados encontrados para: ${text}`,
                            retailerId: "1466",
                            productId: "37199733896340479",
                            productImageCount: 1,
                        },
                        businessOwnerJid: "50432955554@s.whatsapp.net",
                        footer: mensaje
                    }, { messageType: 'product', quoted: m });

                    m.react('✅');

                } catch (e) {
                    console.error(e);
                    m.react('❌');
                    m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Ocurrió un problema con la búsqueda.');
                }
            }
        }
    }
};
