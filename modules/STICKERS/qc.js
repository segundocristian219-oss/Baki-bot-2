import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import axios from 'axios';
import fluent_ffmpeg from "fluent-ffmpeg";
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

function sticker6(img) {
    return new Promise(async (resolve, reject) => {
        try {
            const tmpDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            const tmp = path.join(tmpDir, `${+new Date()}.png`);
            const out = path.join(tmp + ".webp");
            await fs.promises.writeFile(tmp, img);
            fluent_ffmpeg(tmp)
                .on("error", function (err) {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    reject(err);
                })
                .on("end", async function () {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    if (fs.existsSync(out)) {
                        const result = await fs.promises.readFile(out);
                        fs.unlinkSync(out);
                        resolve(result);
                    }
                })
                .addOutputOptions([
                    `-vcodec`, `libwebp`, `-vf`,
                    `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
                ])
                .toFormat("webp")
                .save(out);
        } catch (e) {
            reject(e);
        }
    });
}

export const qcCommand = {
    category: 'tools',
    commands: {
        qc: {
            name: 'qc',
            alias: ['quote'],
            run: async (m, { conn, text }) => {
                try {
                    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);
                    let realText = text ? text.replace(/@\d+/g, '').trim() : (m.quoted ? m.quoted.text : null);

                    if (!realText) return m.reply(`> *✎ Ingresa un texto.*`);
                    if (realText.length > 50) return m.reply(`> *⚠ Máximo 50 caracteres.*`);

                    await m.react('🕓');

                    const pp = await conn.profile(who, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

                    let targetUser = await global.User.findOne({ id: who });
                    let nombre = targetUser?.name || m.quoted?.pushName || await conn.getName(who);

                    if (/^\d+$/.test(nombre)) nombre = who.split('@')[0];

                    const obj = {
                        "type": "quote",
                        "format": "png",
                        "backgroundColor": "#000000",
                        "width": 512,
                        "height": 768,
                        "scale": 2,
                        "messages": [{
                            "entities": [],
                            "avatar": true,
                            "from": {
                                "id": 1,
                                "name": nombre,
                                "photo": { "url": pp }
                            },
                            "text": realText,
                            "replyMessage": {}
                        }]
                    };

                    const response = await axios.post('https://bot.lyo.su/quote/generate', obj, { 
                        headers: { 'Content-Type': 'application/json' } 
                    });

                    const buffer = Buffer.from(response.data.result.image, 'base64');
                    let stikerBuffer = await sticker6(buffer);

                    let pack = name(conn); 
                    let auth = nombre;
                    let exifSticker = await addExif(stikerBuffer, pack, auth);

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
                    console.error('Error en QC:', e);
                    await m.react('✖️');
                }
            }
        }
    }
};
