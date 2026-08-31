import axios from 'axios';

export const tiktokCommand = {
    category: 'search',
    commands: {
        tiktoksearch: {
            name: 'tiktoksearch',
            alias: ['ttss', 'tsearch'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) return conn.reply(m.chat, `*── 「 TIKTOK SEARCH 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>`, m);

                await m.react("🕒");

                try {
                    const apiUrl = `https://api.lempi.lat/s/tiktok?q=${encodeURIComponent(text)}&count=1&apikey=${key}`;
                    const { data: response } = await axios.get(apiUrl, {
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.status || !response.resultados || response.resultados.length === 0) {
                        await m.react("❌");
                        return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para "${text}".`, m);
                    }

                    const video = response.resultados[0];
                    const videoUrl = video.url || `https://www.tiktok.com/@${video.autor?.usuario}/video/${video.id}`;
                    const fmt = (num) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num || 0);

                    const res = await axios.get(video.video, { 
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' },
                        timeout: 0 
                    });
                    const videoBuffer = Buffer.from(res.data);

                    const caption = `*── 「 TIKTOK RESULT 」 ──*\n\n` +
                                    `▢ *TÍTULO:* ${video.titulo || 'Sin descripción'}\n` +
                                    `▢ *AUTOR:* ${video.autor?.nombre || video.autor?.usuario || 'Desconocido'}\n` +
                                    `▢ *DURACIÓN:* ${video.duracion}s\n` +
                                    `▢ *CALIDAD:* ${video.calidad || 'N/A'}\n` +
                                    `▢ *MÉTRICAS:* 👁️ ${fmt(video.estadisticas?.vistas)} | ❤️ ${fmt(video.estadisticas?.likes)}\n\n` +
                                    `▢ *LINK:* ${videoUrl}`;

                    await conn.sendMessage(m.chat, { 
                        video: videoBuffer, 
                        caption: caption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    await m.react("✅");

                } catch (error) {
                    await m.react("❌");
                    conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* Error al procesar o enviar el video completo.`, m);
                }
            }
        }
    }
};
