import axios from 'axios';

export const tiktokDownloadModule = {
    category: 'descargas',
    commands: {
        tiktok: {
            name: 'tiktok',
            alias: ['tt'],
            run: async (m, { conn, args }) => {
                if (!args[0]) return m.reply(`> ⌕ USO: Ingresa un enlace de TikTok`);

                try {
                    await m.react("⏳");

                    const { data: res } = await axios.get(`https://dix.lat/v1/tiktok?url=${encodeURIComponent(args[0])}`);

                    if (!res || !res.success || !res.data) {
                        await m.react("❌");
                        return m.reply("> ⚔ Error al procesar el enlace.");
                    }

                    const data = res.data;

                    const caption = `♫ TIKTOK DOWNLOAD 𝄞\n\n` +
                                    `✰ AUTOR: ${data.author || 'Anónimo'} (@${data.username || '---'})\n` +
                                    `✎ TÍTULO: ${data.title || 'Sin descripción'}\n` +
                                    `📅 PUBLICADO: ${data.published || '---'}\n\n` +
                                    `⌬ ESTADÍSTICAS:\n` +
                                    `◈ VISTAS: ${data.views || '0'}\n` +
                                    `♡ LIKES: ${data.like || '0'}\n` +
                                    `⌗ COMENTARIOS: ${data.comment || '0'}\n` +
                                    `🔖 GUARDADOS: ${data.bookmark || '0'}`;

                    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                        await sendAlbum(conn, m.chat, data.images, {
                            caption: caption,
                            quoted: m
                        });
                    } else if (data.video || data.video_hd || data.video_wm) {
                        const videoUrl = data.video || data.video_hd || data.video_wm;
                        await conn.sendMessage(m.chat, { 
                            video: { url: videoUrl },
                            caption: caption,
                            fileName: `tiktok.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else {
                        await m.react("❌");
                        return m.reply("> ⚔ No se encontró un medio descargable válido.");
                    }

                    await m.react("✅");
                } catch (e) {
                    console.error(e);
                    await m.react("❌");
                    m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
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
            image: { url: url },
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };

        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}
