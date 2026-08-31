import fetch from 'node-fetch';
import FormData from 'form-data';
import * as cheerio from 'cheerio';

async function webp2mp4(source) {
    let form = new FormData();
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
    form.append('new-image-url', isUrl ? source : '');
    form.append('new-image', source, 'image.webp');
    let res = await fetch('https://ezgif.com/webp-to-mp4', { method: 'POST', body: form });
    let html = await res.text();
    const $ = cheerio.load(html);
    let form2 = new FormData();
    let obj = {};
    $('form input[name]').each((i, input) => {
        const name = $(input).attr('name');
        const value = $(input).val();
        obj[name] = value;
        form2.append(name, value);
    });
    let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, { method: 'POST', body: form2 });
    let html2 = await res2.text();
    const $2 = cheerio.load(html2);
    const videoUrl = new URL($2('div#output > p.outfile > video > source').attr('src'), res2.url).toString();
    let videoRes = await fetch(videoUrl);
    let videoBuffer = await videoRes.buffer();
    return videoBuffer;
}

async function webp2png(source) {
    let form = new FormData();
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
    form.append('new-image-url', isUrl ? source : '');
    form.append('new-image', source, 'image.webp');
    let res = await fetch('https://ezgif.com/webp-to-png', { method: 'POST', body: form });
    let html = await res.text();
    const $ = cheerio.load(html);
    let form2 = new FormData();
    let obj = {};
    $('form input[name]').each((i, input) => {
        const name = $(input).attr('name');
        const value = $(input).val();
        obj[name] = value;
        form2.append(name, value);
    });
    let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, { method: 'POST', body: form2 });
    let html2 = await res2.text();
    const $2 = cheerio.load(html2);
    const imgUrl = new URL($2('div#output > p.outfile > img').attr('src'), res2.url).toString();
    let imgRes = await fetch(imgUrl);
    let imgBuffer = await imgRes.buffer();
    return imgBuffer;
}

async function video2gif(source) {
    let form = new FormData();
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
    form.append('new-file-url', isUrl ? source : '');
    form.append('new-file', source, 'video.mp4');
    let res = await fetch('https://ezgif.com/video-to-gif', { method: 'POST', body: form });
    let html = await res.text();
    const $ = cheerio.load(html);
    let form2 = new FormData();
    let obj = {};
    $('form input[name]').each((i, input) => {
        const name = $(input).attr('name');
        const value = $(input).val();
        obj[name] = value;
        form2.append(name, value);
    });
    let res2 = await fetch('https://ezgif.com/video-to-gif/' + obj.file, { method: 'POST', body: form2 });
    let html2 = await res2.text();
    const $2 = cheerio.load(html2);
    const gifUrl = new URL($2('div#output > p.outfile > img').attr('src'), res2.url).toString();
    let gifRes = await fetch(gifUrl);
    let gifBuffer = await gifRes.buffer();
    return gifBuffer;
}

export const toimgCommand = {
    category: 'tools',
    commands: {
        toimg: {
            name: 'toimg',
            alias: ['img', 'stickerimg', 'tovideo', 'tomp4', 'mp4', 'togif', 'gif'],
            run: async (m, { conn, command }) => {
                const q = m.quoted ? m.quoted : m;
                
                const mime = q.mimetype || q.msg?.mimetype || q.message?.stickerMessage?.mimetype || q.message?.videoMessage?.mimetype || q.message?.imageMessage?.mimetype || '';

                const isSticker = /webp/i.test(mime);
                const isVideo = /video/i.test(mime);
                const isImage = /image/i.test(mime);

                if (!isSticker && !isVideo && !isImage) {
                    return conn.sendMessage(m.chat, { text: '❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un sticker, video o imagen.' }, { quoted: m });
                }

                const cmd = command.toLowerCase();
                const targetGif = cmd === 'togif' || cmd === 'gif';
                const targetVideo = cmd === 'tovideo' || cmd === 'tomp4' || cmd === 'mp4';
                const targetImg = cmd === 'toimg' || cmd === 'img' || cmd === 'stickerimg';

                try {
                    await m.react('⏳');

                    const mediaBuffer = await q.download?.();
                    if (!mediaBuffer) {
                        await m.react('❌');
                        return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo en la descarga del archivo." }, { quoted: m });
                    }

                    if (isVideo) {
                        if (targetGif) {
                            const gifBuffer = await video2gif(mediaBuffer);
                            await conn.sendMessage(m.chat, { 
                                video: gifBuffer, 
                                gifPlayback: true, 
                                caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Video convertido a GIF animado." 
                            }, { quoted: m });
                        } else {
                            await m.react('❌');
                            return conn.sendMessage(m.chat, { text: "❯❯ 𝗔𝗩𝗜𝗦𝗢: Para convertir video usa *.togif*." }, { quoted: m });
                        }
                    } 
                    else if (isSticker) {
                        const isAnimated = q.msg?.isAnimated === true || q.message?.stickerMessage?.isAnimated === true;

                        if (isAnimated) {
                            if (targetGif) {
                                const mp4Buffer = await webp2mp4(mediaBuffer);
                                const gifBuffer = await video2gif(mp4Buffer);
                                await conn.sendMessage(m.chat, { 
                                    video: gifBuffer, 
                                    gifPlayback: true, 
                                    caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker animado convertido a GIF." 
                                }, { quoted: m });
                            } else {
                                const videoBuffer = await webp2mp4(mediaBuffer);
                                await conn.sendMessage(m.chat, { 
                                    video: videoBuffer, 
                                    caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker animado convertido a Video." 
                                }, { quoted: m });
                            }
                        } else {
                            if (targetImg) {
                                const imageBuffer = await webp2png(mediaBuffer);
                                await conn.sendMessage(m.chat, { 
                                    image: imageBuffer, 
                                    caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker estático convertido a Imagen." 
                                }, { quoted: m });
                            } else {
                                await m.react('❌');
                                return conn.sendMessage(m.chat, { text: "❯❯ 𝗔𝗩𝗜𝗦𝗢: Este sticker es estático. Usa *.toimg* para convertirlo." }, { quoted: m });
                            }
                        }
                    } 
                    else if (isImage) {
                        if (targetGif) {
                            await m.react('❌');
                            return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: No se puede convertir una imagen estática a GIF." }, { quoted: m });
                        } else {
                            await conn.sendMessage(m.chat, { 
                                image: mediaBuffer, 
                                caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Imagen procesada." 
                            }, { quoted: m });
                        }
                    }

                    await m.react('✅');
                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                    return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: El servicio de conversión externo ha fallado respondiendo." }, { quoted: m });
                }
            }
        }
    }
};