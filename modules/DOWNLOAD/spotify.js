import fetch from 'node-fetch';

export const spotifyDownloadModule = {
    category: 'descargas',
    commands: {
        spotify: {
            name: 'spotify',
            alias: ['spt', 'sp', 'music'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) return m.reply(`> ✎ USO: ${usedPrefix + command} <nombre de la canción o URL>`);

                await m.react('🕓');

                try {
                    const isUrl = text.match(/^(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.link)\/.+$/gi);
                    let track;

                    if (isUrl) {
                        track = { url: text, title: 'Spotify Track' };
                    } else {
                        const searchRes = await fetch(`https://api.delirius.online/search/spotify?q=${encodeURIComponent(text)}&limit=1`);
                        const searchData = await searchRes.json();

                        if (!searchData.status || !searchData.data.length) {
                            await m.react('✖️');
                            return m.reply('> ⚔ ERROR: No se encontraron resultados.');
                        }

                        track = searchData.data[0];

                        let txt = `♫ SPOTIFY DOWNLOAD 𝄞\n\n`;
                        txt += `✰ TÍTULO: ${track.title}\n`;
                        txt += `♛ ARTISTA: ${track.artist}\n`;
                        txt += `✎ ÁLBUM: ${track.album}\n`;
                        txt += `⌬ DURACIÓN: ${track.duration}\n`;
                        txt += `◈ PUBLICADO: ${track.publish}\n\n`;
                        txt += `⌗ Procesando audio, espere un momento...`;

                        await conn.sendMessage(m.chat, { 
                            image: { url: track.image }, 
                            caption: txt 
                        }, { quoted: m });
                    }

                    const downloadRes = await fetch(`https://api.delirius.online/download/spotifydl?url=${track.url}`);
                    const textResponse = await downloadRes.text();

                    let downloadData;
                    try {
                        downloadData = JSON.parse(textResponse);
                    } catch (e) {
                        await m.react('✖️');
                        return console.error("Error parseando JSON de descarga");
                    }

                    if (downloadData.status && downloadData.data.download) {
                        await conn.sendMessage(m.chat, { 
                            audio: { url: downloadData.data.download }, 
                            mimetype: 'audio/mpeg', 
                            fileName: `${track.title}.mp3` 
                        }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('✖️');
                    }

                } catch (e) {
                    await m.react('✖️');
                    m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
                }
            }
        }
    }
};
