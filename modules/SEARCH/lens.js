import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

export const lensCommand = {
    category: 'search',
    commands: {
        lens: {
            name: 'lens',
            alias: ['googlelens', 'searchimage', 'buscarimagen'],
            run: async (m, { conn, command, text }) => {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';
                let imageUrl = null;

                if (!mime.startsWith('image/') && !text) {
                    return m.reply(`> ✰⋆͙̈ Responde a una imagen o ingresa una URL válida para realizar la búsqueda con ➠ *${command}*`);
                }

                await m.react('🕒');

                try {
                    if (mime.startsWith('image/')) {
                        let buffer = await q.download();
                        if (!buffer) {
                            await m.react('❌');
                            return m.reply("> ⚔ Error al obtener la imagen del mensaje.");
                        }

                        const type = await fileTypeFromBuffer(buffer);
                        const fileName = `tmp_${Date.now()}.${type?.ext || 'jpg'}`;

                        const formData = new FormData();
                        const blob = new Blob([buffer], { type: mime });
                        formData.append('file', blob, fileName);

                        const uploadRes = await fetch('https://cdn.dix.lat/upload/tmp?ttl=3600', {
                            method: 'POST',
                            body: formData,
                            headers: { 'User-Agent': 'Drive-Client-Temp' }
                        });

                        const uploadJson = await uploadRes.json();
                        if (uploadJson.status && uploadJson.data?.url) {
                            imageUrl = uploadJson.data.url;
                        } else {
                            await m.react('❌');
                            const uploadErrMsg = typeof uploadJson.error === 'string' ? uploadJson.error : (uploadJson.error?.message || uploadJson.message || JSON.stringify(uploadJson));
                            return m.reply(`> ⚔ *Error al subir la imagen temporal:*\n> ${uploadErrMsg}`);
                        }
                    } else if (text && text.startsWith('http')) {
                        imageUrl = text.trim();
                    } else {
                        await m.react('❌');
                        return m.reply("> ⚔ Debes proporcionar una URL válida que empiece por http:// o https://");
                    }

                    const apiUrl = `https://dix.lat/v1/lens?url=${encodeURIComponent(imageUrl)}`;

                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'DixSystem-Client/1.0'
                        }
                    });

                    const responseText = await response.text();
                    let json;

                    try {
                        json = JSON.parse(responseText);
                    } catch (e) {
                        await m.react('❌');
                        return m.reply(`> ⚔ *Error del Servidor (No JSON):*\n> Status: ${response.status}\n> Body: ${responseText}`);
                    }

                    if (!json.success || !json.data) {
                        await m.react('❌');
                        const exactError = typeof json.error === 'string' ? json.error : (json.error?.message || json.message || JSON.stringify(json));
                        return m.reply(`> ⚔ *Error de la API:*\n> ${exactError}`);
                    }

                    const rawData = json.data;
                    const rawResults = Array.isArray(rawData) ? rawData : (
                        rawData.resultados || 
                        rawData.visual_matches || 
                        rawData.results || 
                        rawData.matches || 
                        rawData.data || 
                        rawData.result || 
                        []
                    );

                    if (!Array.isArray(rawResults) || rawResults.length === 0) {
                        await m.react('❌');
                        return m.reply("> ⍰ No se encontraron coincidencias visuales para esta imagen.");
                    }

                    const getImageUrl = (item) => {
                        if (typeof item === 'string') return item;
                        if (!item) return null;
                        return item.url_origen || item.thumbnail || item.thumbnail?.url || item.image?.url || item.image || item.url || item.source_image || item.link || null;
                    };

                    const validMatches = rawResults.filter(r => getImageUrl(r) !== null);
                    const limitedResults = validMatches.slice(0, 4);
                    const imageUrls = limitedResults.map(r => getImageUrl(r));

                    if (imageUrls.length === 0) {
                        await m.react('❌');
                        return m.reply("> ⍰ Se encontraron datos pero no se pudieron extraer enlaces de imagen válidos.");
                    }

                    const firstItem = limitedResults[0];
                    const tagsText = Array.isArray(rawData.tags) && rawData.tags.length > 0 ? rawData.tags.join(', ') : 'N/A';

                    const caption = `*── 「 GOOGLE LENS SEARCH 」 ──*\n\n` +
                        `▢ *TÍTULO:* ${firstItem.titulo || firstItem.title || 'Sin título'}\n` +
                        `▢ *TAGS:* ${tagsText}\n` +
                        `▢ *COINCIDENCIAS:* ${rawData.total_resultados || validMatches.length}\n` +
                        `▢ *MOSTRANDO:* ${limitedResults.length}\n\n` +
                        `> *Resultados visuales procesados correctamente.*`;

                    await sendAlbum(conn, m.chat, imageUrls, { caption, quoted: m });
                    await m.react('✅');

                } catch (e) {
                    await m.react('❌');
                    console.error(`[ERROR LENS COMMAND]: ${e.message}`);
                    m.reply(`> ⚔ *Error Crítico en el Comando:*\n> ${e.message}`);
                }
            }
        }
    }
};

async function sendAlbum(conn, jid, urls, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: urls.length,
            ...(options.quoted ? {
                contextInfo: {
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    await Promise.all(urls.map(async (url, i) => {
        const msg = await conn.generateWAMessage(jid, {
            image: { url },
            ...(i === 0 ? { caption: options.caption || '' } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };

        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}
