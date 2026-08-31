import yts from 'yt-search';
import sharp from 'sharp';
import axios from 'axios';
import fetch from 'node-fetch';
import { dispatchMediaTask } from '../../src/workers/workerPool.js';

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0';

async function getOptimizedThumbnail(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const resizedBuffer = await sharp(inputBuffer)
        .resize(300, 220, { fit: 'cover' })
        .toFormat('jpeg', { quality: 70 })
        .toBuffer();

    return resizedBuffer;
}

export const downloadsModule = {
    category: 'download',
    commands: {
        youtube_audio: {
            name: 'youtube_audio',
            alias: ['play', 'audio', 'mp3', 'playaudio'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) return conn.reply(m.chat, `*Uso:* ${usedPrefix + command} <búsqueda o enlace>`, m);

                const isDocument = /mp3$/i.test(command);

                try {
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:microsoft\.com\/)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/;
                    const videoMatch = text.match(youtubeRegex);

                    let videoSearchResult = null;

                    if (videoMatch && videoMatch[1]) {
                        const cleanUrl = `https://www.youtube.com/watch?v=${videoMatch[1]}`;
                        const searchResults = await yts(cleanUrl);
                        videoSearchResult = searchResults?.videos?.[0];
                    } else {
                        const searchResults = await yts(text);
                        videoSearchResult = searchResults?.videos?.[0];
                    }

                    if (!videoSearchResult) return conn.reply(m.chat, 'No se encontraron resultados.', m);

                    const maxDurationSeconds = 480;
                    if (videoSearchResult.seconds && videoSearchResult.seconds > maxDurationSeconds) {
                        const h = `*El archivo excede el tamaño/tiempo permitido.*\n\n` +
                            `• *Duración del video:* ${videoSearchResult.timestamp || videoSearchResult.seconds + ' segundos'}\n` +
                            `• *Límite máximo permitido:* 8 minutos`;

                        await global.inapp({
                            chat: m.chat,
                            title: global.name(),
                            text: h,
                            quoted: m
                        });
                        return;
                    }

                    const videoId = videoSearchResult.videoId;
                    const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
                    const thumbUrl = videoSearchResult.image || videoSearchResult.thumbnail;

                    let thumbnailBuffer;
                    try {
                        thumbnailBuffer = await getOptimizedThumbnail(thumbUrl);
                    } catch (e) {
                        thumbnailBuffer = Buffer.alloc(0);
                    }

                    const infoMessage = `TÍTULO: ${videoSearchResult.title || 'No disponible'}\n` +
                        `CANAL: ${videoSearchResult.author?.name || 'No disponible'}\n` +
                        `DURACIÓN: ${videoSearchResult.timestamp || videoSearchResult.duration?.toString() || 'No disponible'}\n` +
                        `VISTAS: ${videoSearchResult.views?.toLocaleString() || 'No disponible'}\n` +
                        `FECHA: ${videoSearchResult.ago || 'No disponible'}\n\n` +
                        `${videoUrl}`;

                    const rawPayload = {
                        buttonsMessage: {
                            contentText: 'YOUTUBE AUDIO DOWNLOAD',
                            footerText: infoMessage,
                            headerType: 6,
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                url: global.surl(),
                                name: videoSearchResult.title || 'YOUTUBE DOWNLOAD',
                                address: `${videoSearchResult.author?.name || 'YouTube'} | ${videoSearchResult.timestamp || 'N/A'}`,
                                jpegThumbnail: thumbnailBuffer
                            },
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardOrigin: "UNKNOWN"
                            }
                        }
                    };

                    await conn.relayMessage(m.chat, rawPayload, { quoted: m });

                    (async () => {
                        try {
                            const apiUrl = `https://api.lempi.lat/dl/yta?quality=320&url=${encodeURIComponent(videoUrl)}&apikey=${key}`;

                            const { data: apiResponse } = await axios.get(apiUrl, {
                                headers: { 'Content-Type': 'application/json' }
                            });

                            if (!apiResponse.status || !apiResponse.datos || !apiResponse.datos.url) {
                                throw new Error('No se pudo obtener el enlace de descarga de la API.');
                            }

                            const downloadUrl = apiResponse.datos.url;

                            const workerResponse = await dispatchMediaTask({ type: 'download_buffer', url: downloadUrl });
                            if (!workerResponse || !workerResponse.buffer) throw new Error('Error al procesar el archivo.');

                            const thumbRes = await fetch(thumbUrl).then(res => res.arrayBuffer());

                            if (isDocument) {
                                const processedThumbnail = await sharp(Buffer.from(thumbRes))
                                    .resize(300, 300, { fit: 'cover' })
                                    .jpeg({ quality: 80 })
                                    .toBuffer();

                                await conn.sendMessage(m.chat, {
                                    document: workerResponse.buffer,
                                    mimetype: 'audio/mpeg',
                                    fileName: `${videoSearchResult.title}.mp3`,
                                    caption: videoSearchResult.title,
                                    jpegThumbnail: processedThumbnail,
                                    contextInfo: { ...global.channelInfo }
                                }, { quoted: m });
                            } else {
                                await conn.sendMessage(m.chat, { audio: workerResponse.buffer, mimetype: 'audio/mpeg' }, { quoted: m });
                            }
                        } catch (parallelError) {
                            console.error('Error en descarga paralela de audio:', parallelError);
                            conn.reply(m.chat, `Error al procesar la descarga de audio: ${parallelError.message}`, m);
                        }
                    })();

                } catch (error) {
                    conn.reply(m.chat, `Error: ${error.message}`, m);
                }
            }
        }
    }
};
