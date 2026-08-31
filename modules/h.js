import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

export const transcribeModule = {
    category: 'tools',
    commands: {
        transcribe: {
            name: 'transcribe',
            alias: ['transcribir', 'totext', 'to-text', 'iaaudio'],
            run: async (m, { conn, usedPrefix, command }) => {
                try {
                    const q = m.quoted ? m.quoted : m;
                    const mime = (q.msg || q).mimetype || '';

                    if (!/audio|video/.test(mime)) {
                        return conn.reply(m.chat, `*Uso:* Responde a un mensaje de audio o video con el comando *${usedPrefix + command}* para obtener la transcripción en texto.`, m);
                    }

                    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

                    const buffer = await q.download();
                    if (!buffer) {
                        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                        return conn.reply(m.chat, 'Error al obtener el archivo multimedia.', m);
                    }

                    const type = await fileTypeFromBuffer(buffer);
                    const fileName = `audio_${Date.now()}.${type?.ext || 'opus'}`;

                    const formData = new FormData();
                    const blob = new Blob([buffer], { type: mime || 'audio/ogg' });
                    formData.append('file', blob, fileName);
                    formData.append('model', 'whisper-large-v3');
                    formData.append('response_format', 'verbose_json');

                    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer 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'
                        },
                        body: formData
                    });

                    const responseText = await response.text();
                    let json;

                    try {
                        json = JSON.parse(responseText);
                    } catch (e) {
                        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                        return conn.reply(m.chat, `Error en la respuesta de Groq API (Status: ${response.status}).`, m);
                    }

                    if (!response.ok || !json.text) {
                        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                        const errorMsg = json.error?.message || 'No se pudo obtener la transcripción.';
                        return conn.reply(m.chat, `Error de Groq API: ${errorMsg}`, m);
                    }

                    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                    const durationSec = json.duration ? Math.round(json.duration) : 'N/A';
                    const textMessage = `∆ *TRANSCRIPCIÓN* ∆\n\n` +
                        `• *Duración:* ${durationSec !== 'N/A' ? durationSec + ' segundos' : 'N/A'}\n\n` +
                        `• *Texto:* \n${json.text.trim()}`;

                    await conn.sendMessage(m.chat, { text: textMessage }, { quoted: m });

                } catch (error) {
                    console.error('Error en transcripción de audio:', error);
                    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    conn.reply(m.chat, `Error al procesar el audio: ${error.message}`, m);
                }
            }
        }
    }
};
