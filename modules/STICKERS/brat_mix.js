import axios from 'axios';
import fetch from "node-fetch";
import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const bratCommand = {
    category: 'sticker',
    commands: {
        brat: {
            name: 'brat',
            alias: ['br'],
            run: async (m, { conn, text }) => {
                try {
                    let txt = text ? text : (m.quoted && m.quoted.text ? m.quoted.text : null);
                    if (!txt) return m.reply(`> *✎ Ingresa un texto.*`);

                    await m.react('🕓');

                    const endpoint = `https://api.delirius.online/canvas/brat?text=${encodeURIComponent(txt)}`;
                    const response = await axios.get(endpoint, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'binary');

                    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

                    let workerResult = await dispatchMediaTask({
                        type: 'convert_brat_or_mix',
                        data: uint8Array,
                        packname: "Brat Sticker",
                        author: `Bot: ${name(conn)}`
                    });

                    if (!workerResult || !workerResult.buffer) {
                        throw new Error("El subproceso Brat devolvió un contenido vacío.");
                    }

                    await conn.sendMessage(m.chat, { 
                        sticker: workerResult.buffer,
                        contextInfo: {
                            forwardingScore: 1, 
                            isForwarded: true,
                            ...channelInfo
                        }
                    }, { quoted: m });
                    await m.react('✅');

                } catch (e) {
                    console.error(e);
                    await m.react('✖️');
                }
            }
        }
    }
};

export const emojiCommand = {
    category: 'sticker',
    commands: {
        emojimix: {
            name: 'emojimix',
            alias: ['mix', 'emomix'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                try {
                    const emojis = text.match(/[\u{1f300}-\u{1f9ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu);

                    if (!emojis || emojis.length < 2) {
                        return m.reply(`> *✎ Ingresa 2 emojis.*\n> *Ejemplo:* ${usedPrefix + command} 😂😬`);
                    }

                    await m.react('🪄');

                    const u1 = emojis[0].codePointAt(0).toString(16);
                    const u2 = emojis[1].codePointAt(0).toString(16);

                    const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u1}/u${u1}_u${u2}.png`;

                    let buffer;
                    const response = await fetch(url);
                    if (!response.ok) {
                        const url2 = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u2}/u${u2}_u${u1}.png`;
                        const res2 = await fetch(url2);
                        if (!res2.ok) return m.reply('> ⚔️ Combinación no disponible.');
                        buffer = await res2.buffer();
                    } else {
                        buffer = await response.buffer();
                    }

                    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

                    let workerResult = await dispatchMediaTask({
                        type: 'convert_emoji_gif',
                        data: uint8Array,
                        packname: name(conn),
                        author: m.pushName || 'User',
                        emojis: emojis
                    });

                    if (!workerResult || !workerResult.buffer) {
                        throw new Error("El subproceso Emojimix devolvió un contenido vacío.");
                    }

                    await conn.sendMessage(m.chat, { 
                        sticker: workerResult.buffer,
                        contextInfo: {
                            forwardingScore: 1, 
                            isForwarded: true,
                            ...channelInfo
                        }
                    }, { quoted: m });
                    await m.react('✅');

                } catch (e) {
                    console.error(e);
                    await m.react('✖️');
                    m.reply(`> ⚔ Error: ${e.message}`);
                }
            }
        }
    }
};
