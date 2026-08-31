import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import webp from "node-webpmux";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function addExif(webpSticker, packname, author, categories = ["🤩"], extra = {}) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: categories,
        ...extra,
    };
    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

export const wmCommand = {
    category: 'sticker',
    commands: {
        wm: {
            name: 'wm',
            alias: ['take', 'stickerwm'],
            run: async (m, { conn, text }) => {
                try {
                    let q = m.quoted ? m.quoted : m;
                    let mime = (q.msg || q).mimetype || '';

                    if (!/webp/.test(mime)) return m.reply(' *♛ Responde a un Sticker.*');

                    await m.react('🕓');

                    let buffer = await q.download();
                    let aut = m.pushName || 'User';
                    if (!buffer) return m.reply('> ⚔ Error al descargar el sticker.');

                    let [pack, auth] = text.includes('|') 
                        ? text.split('|').map(v => v.trim()) 
                        : [text.trim() || name(conn), aut];

                    let exifSticker = await addExif(buffer, pack);

                    await conn.sendMessage(m.chat, { 
                        sticker: exifSticker,
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
                    m.reply('> ⚔ Error al procesar el sticker.');
                }
            }
        }
    }
};
