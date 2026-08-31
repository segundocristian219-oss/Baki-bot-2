import axios from 'axios';

export const ttsCommand = {
    category: 'tools',
    commands: {
        tts: {
            name: 'tts',
            alias: ['voz', 'decir'],
            run: async (m, { conn, text }) => {
                try {
                    let targetText = text;

                    if (!targetText && m.quoted) {
                        targetText = m.quoted.text || m.quoted.caption || m.quoted.description || '';
                    }

                    let voiceParam = null;

                    if (targetText && targetText.includes('|')) {
                        const parts = targetText.split('|');
                        targetText = parts[0].trim();
                        voiceParam = parts[1].trim();
                    }

                    if (!targetText || !targetText.trim()) {
                        const menuRes = await axios.get('https://dix.lat/v1/tts');
                        const data = menuRes.data;

                        let menuText = `🗣️ *OPCIONES DE VOZ DISPONIBLES*\n\n`;
                        menuText += `Uso: \`.tts <texto> | <número_o_voz>\`\n`;
                        menuText += `Ejemplo: \`.tts Hola mundo | 1\`\n\n`;
                        menuText += `*Voces disponibles:*\n`;

                        if (data && data.available_voices) {
                            for (const [key, voiceName] of Object.entries(data.available_voices)) {
                                menuText += `[${key}] ${voiceName}\n`;
                            }
                        } else {
                            menuText += `No se pudo obtener la lista de voces en este momento.`;
                        }

                        return await conn.sendMessage(m.chat, { text: menuText }, { quoted: m });
                    }

                    await m.react('🗣️');

                    const queryParams = {
                        text: targetText
                    };

                    if (voiceParam) {
                        if (!isNaN(voiceParam)) {
                            queryParams.t = voiceParam;
                        } else {
                            queryParams.v = voiceParam;
                        }
                    }

                    const response = await axios.get('https://dix.lat/v1/tts', {
                        params: queryParams,
                        responseType: 'arraybuffer'
                    });

                    const contentType = response.headers['content-type'] || '';

                    if (contentType.includes('application/json')) {
                        const jsonString = Buffer.from(response.data).toString('utf-8');
                        const data = JSON.parse(jsonString);

                        let menuText = `⚠️ *${data.error?.message || 'Error en la solicitud'}*\n\n`;
                        if (data.available_voices) {
                            menuText += `*Voces disponibles:*\n`;
                            for (const [key, voiceName] of Object.entries(data.available_voices)) {
                                menuText += `[${key}] ${voiceName}\n`;
                            }
                        }
                        await m.react('❌');
                        return await conn.sendMessage(m.chat, { text: menuText }, { quoted: m });
                    }

                    const buffer = Buffer.from(response.data);

                    await conn.sendMessage(m.chat, { 
                        audio: buffer, 
                        mimetype: 'audio/mp4', 
                        ptt: false 
                    }, { quoted: m });

                    await m.react('✅');

                } catch (error) {
                    console.error('Error en TTS:', error);
                    await m.react('❌');
                }
            }
        }
    }
};
