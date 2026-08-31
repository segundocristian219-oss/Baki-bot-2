import axios from 'axios';

export const threadsDownloadModule = {
    category: 'descargas',
    commands: {
        threads: {
            name: 'threads',
            alias: ['th', 'threadsdl'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                if (!args[0]) return m.reply(`Ingresa un enlace.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.net/@user/post/ID`);

                const url = args[0].split('?')[0];

                try {
                    await m.reply('⏳ Buscando contenido...');

                    const headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Cache-Control': 'no-cache',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-CH-UA': '"Chromium";v="122", "Not(A:Brand";v="24"',
                        'Sec-CH-UA-Mobile': '?0',
                        'Sec-CH-UA-Platform': '"Windows"',
                        'Upgrade-Insecure-Requests': '1'
                    };

                    const { data: html } = await axios.get(url, { headers, timeout: 15000 });

                    let mediaItems = [];
                    let description = '';

                    try {
                        const jsonMatches = html.match(/<script[^>]*type="application\/json"[^>]*>(\{[\s\S]*?\})<\/script>/g) || [];

                        for (const scriptTag of jsonMatches) {
                            const jsonStr = scriptTag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
                            try {
                                const parsed = JSON.parse(jsonStr);
                                const found = extractMediaFromJson(parsed);
                                if (found.length > 0) {
                                    mediaItems = found;
                                    break;
                                }
                            } catch (_) {}
                        }

                        if (mediaItems.length === 0) {
                            const bboxMatch = html.match(/require\(\["TSPBootstrapper"\][^)]*\)/g) ||
                                             html.match(/"video_versions":\s*(\[[\s\S]*?\])/g) ||
                                             html.match(/"image_versions2":\s*(\{[\s\S]*?\})/g);

                            if (bboxMatch) {
                                for (const m of bboxMatch) {
                                    const videoMatch = m.match(/"url":"([^"]+\.mp4[^"]*)"/g);
                                    const imageMatch = m.match(/"url":"([^"]+\.jpg[^"]*)"/g) || m.match(/"url":"([^"]+\.webp[^"]*)"/g);

                                    if (videoMatch) {
                                        mediaItems.push({ type: 'video', url: cleanUrl(videoMatch[0].replace(/"url":"/, '').replace(/"$/, '')) });
                                    } else if (imageMatch) {
                                        mediaItems.push({ type: 'image', url: cleanUrl(imageMatch[imageMatch.length - 1].replace(/"url":"/, '').replace(/"$/, '')) });
                                    }
                                }
                            }
                        }
                    } catch (_) {}

                    if (mediaItems.length === 0) {
                        const videoMatches = [...html.matchAll(/<meta[^>]*property="og:video(?::url)?"[^>]*content="([^"]+)"/g)];
                        for (const match of videoMatches) {
                            mediaItems.push({ type: 'video', url: cleanUrl(match[1]) });
                        }

                        if (mediaItems.length === 0) {
                            const imageMatches = [...html.matchAll(/<meta[^>]*property="og:image"[^\s>]*\s*content="([^"]+)"/g)];
                            for (const match of imageMatches) {
                                const imgUrl = cleanUrl(match[1]);
                                if (!imgUrl.includes('instagram.com/static') && !imgUrl.includes('fbcdn.net/rsrc')) {
                                    mediaItems.push({ type: 'image', url: imgUrl });
                                }
                            }
                        }
                    }

                    description = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] ||
                                 html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ||
                                 'Threads Content';

                    description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

                    const seen = new Set();
                    mediaItems = mediaItems.filter(item => {
                        const key = item.url.split('?')[0];
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });

                    if (mediaItems.length === 0) {
                        return m.reply('❌ No se encontró contenido multimedia. El post puede ser privado, solo texto, o Threads bloqueó el acceso.');
                    }

                    const caption = `*── 「 THREADS 」 ──*\n\n▢ *DESCRIPCIÓN:* ${description}\n▢ *ARCHIVOS:* ${mediaItems.length}\n▢ *TIPO:* ${mediaItems[0].type === 'video' ? '🎥 Video' : '🖼️ Imagen'}\n\n`;

                    if (mediaItems.length === 1) {
                        const item = mediaItems[0];
                        try {
                            const res = await axios.get(item.url, {
                                responseType: 'arraybuffer',
                                headers: {
                                    'Referer': 'https://www.threads.net/',
                                    'User-Agent': headers['User-Agent']
                                },
                                timeout: 30000
                            });

                            const buffer = Buffer.from(res.data, 'binary');

                            await conn.sendMessage(m.chat, {
                                [item.type]: buffer,
                                caption: caption,
                                mimetype: item.type === 'video' ? 'video/mp4' : 'image/jpeg'
                            }, { quoted: m });
                        } catch (dlErr) {
                            console.error(`Error descargando ${item.type}:`, dlErr.message);
                            m.reply('❌ Se encontró el contenido pero falló la descarga. Intenta de nuevo.');
                        }
                    } else {
                        const medias = mediaItems.map(item => ({
                            type: item.type,
                            data: { url: item.url }
                        }));

                        await sendAlbum(conn, m.chat, medias, {
                            caption: caption,
                            quoted: m,
                            delay: 500
                        });
                    }

                } catch (error) {
                    console.error('Threads Error:', error.message);
                    if (error.response?.status === 403 || error.response?.status === 429) {
                        m.reply('❌ Threads bloqueó la solicitud (rate limit). Espera unos minutos e intenta de nuevo.');
                    } else if (error.response?.status === 404) {
                        m.reply('❌ Post no encontrado. Verifica que el enlace sea correcto y el post sea público.');
                    } else {
                        m.reply('❌ Error al conectar con Threads. Verifica que el post sea público.');
                    }
                }
            }
        }
    }
};

function cleanUrl(url) {
    return url.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\/g, '');
}

function extractMediaFromJson(obj, results = [], depth = 0) {
    if (depth > 15 || !obj || typeof obj !== 'object') return results;

    const hasVideo = Array.isArray(obj.video_versions) && obj.video_versions.length > 0;
    const hasImage = obj.image_versions2?.candidates?.length > 0;

    if (hasVideo) {
        const best = obj.video_versions.reduce((a, b) => ((b.width || 0) > (a.width || 0) ? b : a));
        if (best?.url) results.push({ type: 'video', url: cleanUrl(best.url) });
    }

    if (hasImage && !hasVideo) {
        const best = obj.image_versions2.candidates.reduce((a, b) => ((b.width || 0) > (a.width || 0) ? b : a));
        if (best?.url) results.push({ type: 'image', url: cleanUrl(best.url) });
    }

    if (Array.isArray(obj.carousel_media)) {
        for (const item of obj.carousel_media) {
            extractMediaFromJson(item, results, depth + 1);
        }
        return results;
    }

    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
            extractMediaFromJson(val, results, depth + 1);
        }
    }

    return results;
}

async function sendAlbum(conn, jid, medias, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        messageContextInfo: {},
        albumMessage: {
            expectedImageCount: medias.filter(m => m.type === "image").length,
            expectedVideoCount: medias.filter(m => m.type === "video").length,
            ...(options.quoted ? {
                contextInfo: {
                    remoteJid: options.quoted.key.remoteJid,
                    fromMe: options.quoted.key.fromMe,
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const msg = await conn.generateWAMessage(album.key.remoteJid, {
            [type]: data,
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };
        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
        if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay));
    }
}
