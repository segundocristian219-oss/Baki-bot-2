import { dispatchMediaTask } from '../../src/workers/workerPool.js';

const sessions = new Map();

export const copilotCommand = {
    category: 'ai',
    commands: {
        copilot: {
            name: 'copilot',
            alias: ['copilot', 'ms'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.sendMessage(m.chat, { text: '¿En qué puedo ayudarte?' }, { quoted: m });

                await m.react('⏳');
                try {
                    const history = sessions.get(m.sender) || [];
                    const { text: responseText, media } = await dispatchMediaTask({
                        type: 'scrape_copilot',
                        prompt: text,
                        history
                    });

                    history.push({ q: text, a: responseText });
                    if (history.length > 5) history.shift();
                    sessions.set(m.sender, history);

                    await m.react('✅');

                    if (media?.length > 0) {
                        await sendAlbum(conn, m.chat, media.slice(0, 10), { caption: responseText, quoted: m });
                    } else {
                        await conn.sendMessage(m.chat, { text: responseText, contextInfo: { ...global.channelInfo } }, { quoted: m });
                    }
                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                    conn.sendMessage(m.chat, { text: `⚠️ Error: ${e.message}` }, { quoted: m });
                }
            }
        }
    }
};

async function sendAlbum(conn, jid, mediaList, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: mediaList.filter(i => i.type === 'image').length,
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

    await Promise.all(mediaList.map(async (item, i) => {
        const { buffer } = await dispatchMediaTask({ type: 'download_buffer', url: item.url, mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg' });
        const buf = Buffer.from(buffer, 'base64');
        const mediaType = item.type === 'video' ? { video: buf } : { image: buf };
        const msg = await conn.generateWAMessage(jid, { ...mediaType, ...(i === 0 ? { caption: options.caption || '' } : {}) }, { upload: conn.waUploadToServer });
        msg.message.messageContextInfo = { messageAssociation: { associationType: 1, parentMessageKey: album.key } };
        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}