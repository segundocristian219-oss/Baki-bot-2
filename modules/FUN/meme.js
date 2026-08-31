import axios from 'axios';

export const memesCommand = {
    category: 'fun',
    commands: {
        memes: {
            name: 'memes',
            alias: ['meme'],
            run: async (m, { conn }) => {
                try {
                    m.react('🕒');

                    const { data: res } = await axios.get('https://meme-api.com/gimme/spanishmeme', {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    });

                    if (!res || !res.url) {
                        m.react('❌');
                        return conn.reply(m.chat, `> ⍰ No se encontraron memes frescos en este momento.`, m);
                    }

                    const memeUrl = res.url;
                    const memeTitle = res.title || '¡Aquí tienes tu dosis de humor!';

                    await conn.sendMessage(m.chat, { 
                        image: { url: memeUrl }, 
                        caption: `*── 「 MEMES FRESCOS 」 ──*\n\n> 😂 *${memeTitle}*\n\n*❯ Fuente:* r/${res.subreddit || 'SpanishMeme'}`,
                        mentions: [m.sender]
                    }, { quoted: m });

                    m.react('✅');

                } catch (error) {
                    console.error(`> [ERROR]: ${error.message}`);
                    m.react('❌');
                }
            }
        }
    }
};
