import axios from 'axios';
import crypto from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';

const API_KEY = 'sylph-044f3a74';

function hkdf(key, length, info = '') {
    const h = crypto.createHmac('sha256', Buffer.alloc(32)).update(key).digest();
    const infoBuffer = Buffer.from(info);
    const output = [];
    let prev = Buffer.alloc(0);
    let done = 0;
    let i = 0;
    while (done < length) {
        i++;
        const hmac = crypto.createHmac('sha256', h);
        hmac.update(prev);
        hmac.update(infoBuffer);
        hmac.update(Buffer.from([i]));
        prev = hmac.digest();
        output.push(prev);
        done += prev.length;
    }
    return Buffer.concat(output).slice(0, length);
}

function encryptBuffer(buffer, hkdfInfo) {
    const mediaKey = crypto.randomBytes(32);
    const keys = hkdf(mediaKey, 112, hkdfInfo);
    const iv = keys.slice(0, 16);
    const cipherKey = keys.slice(16, 48);
    const macKey = keys.slice(48, 80);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().slice(0, 10);
    const encBody = Buffer.concat([encrypted, mac]);
    const fileSha256 = crypto.createHash('sha256').update(buffer).digest();
    const fileEncSha256 = crypto.createHash('sha256').update(encBody).digest();
    return { mediaKey, encBody, fileSha256, fileEncSha256 };
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const b of buf) {
        crc ^= b;
        for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
    const localParts = [];
    const centralDirs = [];
    let offset = 0;
    for (const file of files) {
        const name = Buffer.from(file.name, 'utf8');
        const crc = crc32(file.data);
        const size = file.data.length;
        const local = Buffer.alloc(30 + name.length);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(0, 8);
        local.writeUInt16LE(0, 10);
        local.writeUInt16LE(0, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(size, 18);
        local.writeUInt32LE(size, 22);
        local.writeUInt16LE(name.length, 26);
        local.writeUInt16LE(0, 28);
        name.copy(local, 30);
        localParts.push(local, file.data);
        const cd = Buffer.alloc(46 + name.length);
        cd.writeUInt32LE(0x02014b50, 0);
        cd.writeUInt16LE(20, 4);
        cd.writeUInt16LE(20, 6);
        cd.writeUInt16LE(0, 8);
        cd.writeUInt16LE(0, 10);
        cd.writeUInt16LE(0, 12);
        cd.writeUInt16LE(0, 14);
        cd.writeUInt32LE(crc, 16);
        cd.writeUInt32LE(size, 20);
        cd.writeUInt32LE(size, 24);
        cd.writeUInt16LE(name.length, 28);
        cd.writeUInt16LE(0, 30);
        cd.writeUInt16LE(0, 32);
        cd.writeUInt16LE(0, 34);
        cd.writeUInt16LE(0, 36);
        cd.writeUInt32LE(0, 38);
        cd.writeUInt32LE(offset, 42);
        name.copy(cd, 46);
        centralDirs.push(cd);
        offset += 30 + name.length + size;
    }
    const central = Buffer.concat(centralDirs);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(central.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);
    return Buffer.concat([...localParts, central, eocd]);
}

let patchedDefaults = false;
async function patchMediaPathMap() {
    if (patchedDefaults) return;
    try {
        const defaults = await import('/home/container/node_modules/@whiskeysockets/baileys/lib/Defaults/index.js');
        defaults.MEDIA_PATH_MAP['sticker-pack'] = '/mms/sticker-pack';
        defaults.MEDIA_HKDF_KEY_MAPPING['sticker-pack'] = 'Sticker Pack';
        patchedDefaults = true;
    } catch (e) {
        console.error(e.message);
    }
}

async function uploadBuffer(conn, buffer, mediaType) {
    if (!buffer || buffer.length === 0) return null;
    const enc = encryptBuffer(buffer, mediaType === 'sticker' ? 'WhatsApp Image Keys' : 'WhatsApp Sticker Pack Keys');
    const tmpPath = join(tmpdir(), `wa-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.enc`);
    await writeFile(tmpPath, enc.encBody);
    try {
        const result = await conn.waUploadToServer(tmpPath, {
            fileEncSha256B64: enc.fileEncSha256.toString('base64'),
            mediaType
        });
        return { ...enc, directPath: result.directPath };
    } finally {
        unlink(tmpPath).catch(() => {});
    }
}

export const stickerPackCommand = {
    category: 'search',
    commands: {
        stickerpack: {
            name: 'stickerpack',
            alias: ['spack', 'stickerly'],
            run: async (m, { conn, text }) => {
                if (!text) return m.reply('Ingresa el nombre.');
                try {
                    await m.react('🕒');
                    await patchMediaPathMap();

                    const { data: searchRes } = await axios.get(`https://sylphyy.xyz/search/stickerly?q=${encodeURIComponent(text)}&api_key=${API_KEY}`);

                    if (!searchRes.status || !searchRes.result?.length) return m.reply('Sin resultados.');
                    const pack = searchRes.result[0];

                    const { data: dlRes } = await axios.get(`https://sylphyy.xyz/download/stickerly?url=${encodeURIComponent(pack.url)}&api_key=${API_KEY}`);

                    if (!dlRes.status || !dlRes.result?.stickers) return m.reply('Error al descargar.');

                    const packData = dlRes.result;
                    const stickersToProcess = packData.stickers.slice(0, 5);

                    const [coverRes, ...stickerResps] = await Promise.all([
                        axios.get(packData.thumbnailUrl, { responseType: 'arraybuffer' }),
                        ...stickersToProcess.map(s => axios.get(s.imageUrl, { responseType: 'arraybuffer' }))
                    ]);

                    const trayBuffer = await sharp(Buffer.from(coverRes.data))
                        .resize(96, 96)
                        .png()
                        .toBuffer()
                        .catch(() => null);

                    if (!trayBuffer) throw new Error('Error al procesar el icono del paquete.');

                    const processedStickers = (await Promise.all(
                        stickerResps.map(async (resp, i) => {
                            try {
                                const inputBuf = Buffer.from(resp.data);
                                if (inputBuf.length < 100) return null;

                                const isAnimated = stickersToProcess[i].isAnimated || false;

                                return await sharp(inputBuf, { animated: isAnimated })
                                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                                    .webp({ quality: 75, loop: 0, force: true })
                                    .toBuffer();
                            } catch (err) {
                                return null;
                            }
                        })
                    )).filter(buf => buf !== null);

                    if (processedStickers.length === 0) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo procesar ningún sticker del paquete.');

                    const stickerUploadResults = (await Promise.all(
                        processedStickers.map(buf => uploadBuffer(conn, buf, 'sticker'))
                    )).filter(res => res !== null);

                    const zipFiles = [];
                    const stickerMeta = [];

                    for (let i = 0; i < processedStickers.length; i++) {
                        const hash = crypto.createHash('sha256').update(processedStickers[i]).digest('base64url');
                        const fileName = `${String(i).padStart(2, '0')}_${hash}.webp`;
                        zipFiles.push({ name: fileName, data: processedStickers[i] });
                        stickerMeta.push({
                            fileName,
                            isAnimated: stickersToProcess[i].isAnimated || false,
                            emojis: ['✨'],
                            mimetype: 'image/webp',
                            accessibilityLabel: ''
                        });
                    }

                    const packEncTemp = encryptBuffer(buildZip(zipFiles), 'WhatsApp Sticker Pack Keys');
                    const packId = packEncTemp.fileEncSha256.toString('base64url');
                    const trayIconName = `${packId}.png`;

                    const finalZipBuffer = buildZip([{ name: trayIconName, data: trayBuffer }, ...zipFiles]);
                    const packUpload = await uploadBuffer(conn, finalZipBuffer, 'sticker-pack');

                    if (!packUpload) throw new Error('Error al subir el paquete de stickers.');

                    const thumbSha256 = crypto.createHash('sha256').update(trayBuffer).digest();
                    const thumbKeys = hkdf(packUpload.mediaKey, 112, 'WhatsApp Sticker Pack Keys');
                    const thumbCipher = crypto.createCipheriv('aes-256-cbc', thumbKeys.slice(16, 48), thumbKeys.slice(0, 16));
                    const thumbEnc = Buffer.concat([thumbCipher.update(trayBuffer), thumbCipher.final()]);
                    const thumbMac = crypto.createHmac('sha256', thumbKeys.slice(48, 80)).update(thumbKeys.slice(0, 16)).update(thumbEnc).digest().slice(0, 10);
                    const thumbEncSha256 = crypto.createHash('sha256').update(Buffer.concat([thumbEnc, thumbMac])).digest();

                    const msgId = crypto.randomBytes(8).toString('hex').toUpperCase();

                    await conn.relayMessage(m.chat, {
                        stickerPackMessage: {
                            stickerPackId: packUpload.fileEncSha256.toString('base64url'),
                            name: packData.name.substring(0, 30),
                            publisherName: packData.author.name || name(conn),
                            trayIconFileName: trayIconName,
                            stickers: stickerMeta,
                            stickerPackSize: finalZipBuffer.length,
                            stickerPackOrigin: 'THIRD_PARTY',
                            mediaKey: packUpload.mediaKey,
                            fileLength: packUpload.encBody.length,
                            fileSha256: packUpload.fileSha256,
                            fileEncSha256: packUpload.fileEncSha256,
                            directPath: packUpload.directPath,
                            thumbnailDirectPath: packUpload.directPath,
                            thumbnailSha256: thumbSha256,
                            thumbnailEncSha256: thumbEncSha256,
                            thumbnailHeight: 96,
                            thumbnailWidth: 96,
                            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                            packDescription: name(conn),
                            imageDataHash: thumbSha256.toString('base64')
                        }
                    }, { messageId: msgId, quoted: m });

                    await m.react('✅');

                } catch (e) {
                    console.error('Error en StickerPack:', e);
                    await m.react('❌');
                    m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${e.message}`);
                }
            }
        }
    }
};