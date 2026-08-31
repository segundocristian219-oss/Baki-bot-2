import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const pinterest = {
    category: 'search',
    commands: {
        pin: {
            name: 'pinterest',
            alias: ['pin'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.reply(m.chat, `> PINTEREST SEARCH\n\n> ✎ Ingresa un texto para iniciar la búsqueda...`, m);

                try {
                    await m.react('🕒');

                    const { results } = await dispatchMediaTask({
                        type: 'scrape_pinterest',
                        query: text
                    });

                    if (!results?.length) {
                        await m.react('❌');
                        return conn.reply(m.chat, `> ⍰ No se encontraron resultados para: *${text}*`, m);
                    }

                    const limitedResults = results.slice(0, 4);
                    const item = limitedResults[0];
                    const imageUrls = limitedResults.map(r => r.url);

                    const caption = `\t\t\t *PINTEREST SEARCH \n\n` +
                        `▢ *BÚSQUEDA:* ${text}\n` +
                        `▢ *TÍTULO:* ${item.title || 'Sin título'}\n` +
                        `▢ *AUTOR:* ${item.author || 'Desconocido'}\n` +
                        `▢ *TABLERO:* ${item.board || 'N/A'}\n` +
                        `▢ *ID:* ${item.id}\n` +
                        `▢ *ENLACE:* ${item.pin_url}\n` +
                        `▢ *CANTIDAD:* ${limitedResults.length}\n\n`;

                    await sendAlbum(conn, m.chat, imageUrls, { caption, quoted: m });
                    await m.react('✅');

                } catch (error) {
                    await m.react('❌');
                    console.error(`[ERROR PINTEREST]: ${error.message}`);
                    conn.reply(m.chat, `> ⚔ Error: ${error.message}`, m);
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