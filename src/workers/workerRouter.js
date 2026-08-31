import { parentPort } from 'worker_threads';
import { pipeline } from 'stream/promises';
import { createWriteStream, unlinkSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import ffmpegModule from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "file-type";
import webp from "node-webpmux";
import sharp from "sharp";
import { scrapePinterest } from './scrapers/pinterest.js';

const fluent_ffmpeg = typeof ffmpegModule === 'function' ? ffmpegModule : (ffmpegModule.default || ffmpegModule);

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = process.env.TMPDIR || '/home/container/tmp';
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

try {
    const ffmpegInstaller = await import("@ffmpeg-installer/ffmpeg");
    if (ffmpegInstaller && ffmpegInstaller.default && ffmpegInstaller.default.path) {
        fluent_ffmpeg.setFfmpegPath(ffmpegInstaller.default.path);
    } else {
        fluent_ffmpeg.setFfmpegPath('ffmpeg');
    }
} catch (e) {
    fluent_ffmpeg.setFfmpegPath('ffmpeg');
}

let activeFfmpegCommand = null;

function killActiveFfmpeg() {
    if (activeFfmpegCommand) {
        try { activeFfmpegCommand.kill('SIGKILL'); } catch (_) {}
        activeFfmpegCommand = null;
    }
}

function cleanTmp() {
    try {
        const now = Date.now();
        for (const file of readdirSync(TMP_DIR)) {
            if (!file.startsWith('mw_') && !file.startsWith('stk_')) continue;
            const filePath = join(TMP_DIR, file);
            try {
                const { mtimeMs } = statSync(filePath);
                if (now - mtimeMs > 300000) unlinkSync(filePath);
            } catch (_) {}
        }
    } catch (_) {}
}

cleanTmp();

async function addExif(webpSticker, packname, author, categories = ["🤩"], extra = {}) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": randomBytes(32).toString("hex"),
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

function processVideoSticker(img, ext) {
    return new Promise((resolve, reject) => {
        let tmp = null;
        let out = null;

        const cleanupPaths = () => {
            try { if (tmp && existsSync(tmp)) unlinkSync(tmp); } catch (_) {}
            try { if (out && existsSync(out)) unlinkSync(out); } catch (_) {}
        };

        try {
            tmp = join(TMP_DIR, `stk_${randomBytes(6).toString('hex')}.${ext}`);
            out = join(tmp + ".webp");

            writeFileSync(tmp, img);

            const Fffmpeg = fluent_ffmpeg(tmp).inputFormat(ext);
            activeFfmpegCommand = Fffmpeg;

            Fffmpeg.on("error", function (err) {
                activeFfmpegCommand = null;
                cleanupPaths();
                reject(err);
            })
            .on("end", function () {
                activeFfmpegCommand = null;
                try {
                    if (existsSync(out)) {
                        const result = readFileSync(out);
                        cleanupPaths();
                        resolve(result);
                    } else {
                        cleanupPaths();
                        reject(new Error("FFmpeg finalizó pero no se generó el archivo de salida webp."));
                    }
                } catch (e) {
                    cleanupPaths();
                    reject(e);
                }
            })
            .addOutputOptions([
                `-vcodec`, `libwebp`, `-vf`,
                `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
            ])
            .toFormat("webp")
            .save(out);
        } catch (e) {
            activeFfmpegCommand = null;
            cleanupPaths();
            reject(e);
        }
    });
}

async function processStickerBuffer(buffer) {
    if (buffer.length > 15 * 1024 * 1024) throw new Error('Archivo demasiado grande (máx 15MB)');

    const type = (await fileTypeFromBuffer(buffer)) || { mime: "image/jpeg", ext: "jpg" };

    if (/video/i.test(type.mime)) {
        return await processVideoSticker(buffer, type.ext);
    }

    return await sharp(buffer, { animated: true, failOnError: false })
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({
            loop: 0,
            quality: 65,
            lossless: false,
            effort: 4
        })
        .toBuffer();
}

const handlers = {
    fetch_json: async (task) => {
        const opts = { method: task.method || 'GET', headers: { 'Accept': 'application/json', ...(task.headers || {}) } };
        if (task.body) opts.body = task.body;
        const res = await fetch(task.url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { json: await res.json() };
    },
    fetch_text: async (task) => {
        const opts = { method: task.method || 'GET', headers: task.headers || {} };
        if (task.body) opts.body = task.body;
        const res = await fetch(task.url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { text: await res.text() };
    },
    fetch_head: async (task) => {
        const res = await fetch(task.url, { method: 'HEAD', headers: task.headers || {} });
        return { contentLength: res.headers.get('content-length') || '0', contentType: res.headers.get('content-type') || '' };
    },
    download_buffer: async (task) => {
        const res = await fetch(task.url, { headers: task.headers || {} });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        return {
            isBuffer: true,
            data: uint8Array,
            mimeType: task.mimeType || 'application/octet-stream'
        };
    },
    download_file: async (task) => {
        const tmpPath = join(TMP_DIR, `mw_${randomBytes(6).toString('hex')}.${task.ext || 'bin'}`);
        const res = await fetch(task.url, { headers: task.headers || {} });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await pipeline(res.body, createWriteStream(tmpPath));
        const buf = readFileSync(tmpPath);
        try { unlinkSync(tmpPath); } catch (_) {}
        const uint8Array = new Uint8Array(buf);
        return {
            isBuffer: true,
            data: uint8Array,
            mimeType: task.mimeType || 'application/octet-stream'
        };
    },
    convert_sticker: async (task) => {
        const inputBuffer = Buffer.from(task.data);
        let rawSticker = await processStickerBuffer(inputBuffer);
        let completeSticker = await addExif(rawSticker, task.packname, task.author);
        const uint8Array = new Uint8Array(completeSticker);
        return {
            isBuffer: true,
            data: uint8Array
        };
    },
    convert_emoji_gif: async (task) => {
        const inputBuffer = Buffer.from(task.data);
        let convertedWebp = await processStickerBuffer(inputBuffer);
        let completeSticker = await addExif(convertedWebp, task.packname, task.author, task.emojis || ["🤩"]);
        const uint8Array = new Uint8Array(completeSticker);
        return {
            isBuffer: true,
            data: uint8Array
        };
    },
    convert_brat_or_mix: async (task) => {
        const inputBuffer = Buffer.from(task.data);
        let rawSticker = await processStickerBuffer(inputBuffer);
        let completeSticker = await addExif(rawSticker, task.packname, task.author);
        const uint8Array = new Uint8Array(completeSticker);
        return {
            isBuffer: true,
            data: uint8Array
        };
    },
    scrape_pinterest: scrapePinterest
};

parentPort.on('message', async (task) => {
    if (task && task.type === '__shutdown__') {
        killActiveFfmpeg();
        try {
            parentPort.postMessage({ type: '__shutdown_ack__' });
        } catch (_) {}
        return;
    }

    try {
        const handler = handlers[task.type];
        if (!handler) throw new Error(`Tipo desconocido: ${task.type}`);

        const result = await handler(task);

        if (result && result.isBuffer && result.data) {
            const cleanUint8Array = new Uint8Array(result.data);
            result.data = cleanUint8Array;

            parentPort.postMessage({ success: true, result });
        } else {
            parentPort.postMessage({ success: true, result });
        }
    } catch (e) {
        activeFfmpegCommand = null;
        parentPort.postMessage({ success: false, error: e.message });
    } finally {
        cleanTmp();
    }
});
