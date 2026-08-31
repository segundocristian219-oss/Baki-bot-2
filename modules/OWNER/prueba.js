const toBase64 = (buf) => Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64');

export const inspectAudioModule = {
    category: 'owner',
    commands: {
        gen: {
            name: 'gen',
            alias: ['getcode'],
            owner: true,
            run: async (m, { conn }) => {
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde a un mensaje', m);
                const msg = q.message || q.msg || {};
                const type = q.mtype || Object.keys(msg)[0];
                const c = msg[type];

                const replacer = (key, value) => {
                    if (value && value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data).toString('base64');
                    if (value instanceof Uint8Array) return toBase64(value);
                    if (typeof value === 'object' && value && value.low !== undefined && value.high !== undefined) return value.toNumber ? value.toNumber() : Number(value.low);
                    return value;
                };

                let payload = {};
                if (type === 'stickerMessage') payload = { stickerMessage: c };
                else if (type === 'productMessage') payload = { productMessage: c };
                else if (type === 'imageMessage') payload = { imageMessage: c };
                else if (type === 'videoMessage') payload = { videoMessage: c };
                else if (type === 'audioMessage') payload = { audioMessage: c };
                else if (type === 'documentMessage') payload = { documentMessage: c };
                else if (type === 'locationMessage') payload = { locationMessage: c };
                else if (type === 'liveLocationMessage') payload = { liveLocationMessage: c };
                else if (type === 'contactMessage') payload = { contactMessage: c };
                else if (type === 'contactsArrayMessage') payload = { contactsArrayMessage: c };
                else if (type === 'buttonsMessage') payload = { buttonsMessage: c };
                else if (type === 'templateMessage') payload = { templateMessage: c };
                else if (type === 'listMessage') payload = { listMessage: c };
                else if (type === 'interactiveMessage') payload = { interactiveMessage: c };
                else if (type === 'pollCreationMessage') payload = { pollCreationMessage: c };
                else if (type === 'extendedTextMessage') payload = { extendedTextMessage: c };
                else if (type === 'conversation') payload = { conversation: c };
                else payload = msg;

                const json = JSON.stringify(payload, replacer, 2);
                if (json.length > 4000) {
                    await conn.sendMessage(m.chat, {
                        document: Buffer.from(json),
                        mimetype: 'application/json',
                        fileName: `raw_${type}_${Date.now()}.json`
                    }, { quoted: m });
                } else {
                    await conn.reply(m.chat, `\`\`\`json\n${json}\n\`\`\``, m);
                }
            }
        },
        run: {
            name: 'run',
            alias: ['ejecutar'],
            owner: true,
            run: async (m, { conn }) => {
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde al JSON', m);

                try {
                    let txt = '';

                    if (q.mtype === 'documentMessage') {
                        const buffer = q.download ? await q.download() : await conn.downloadMediaMessage(q);
                        txt = buffer.toString('utf-8');
                    } else {
                        txt = q.text || q.msg?.caption || '';
                        txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
                    }

                    const raw = JSON.parse(txt);
                    const rootType = Object.keys(raw)[0] || 'Desconocido';
                    
                    const innerKeys = raw[rootType] && typeof raw[rootType] === 'object' 
                        ? Object.keys(raw[rootType]).join(', ') 
                        : 'Sin campos internos';

                    const messageId = await conn.relayMessage(m.chat, raw, {});

                    const infoText = `> *✎ Mensaje procesado correctamente*\n\n` +
                        `*• Estructura Raíz:* \`${rootType}\`\n` +
                        `*• Campos Internos:* \`${innerKeys}\`\n` +
                        `*• ID de Mensaje:* \`${messageId || 'N/A'}\``;

                    await conn.reply(m.chat, infoText, m);
                } catch (e) {
                    await conn.reply(m.chat, `❌ Error: ${e.message}`, m);
                }
            }
        }
    }
};
