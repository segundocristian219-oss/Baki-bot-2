/*import { promises as fsPromises, existsSync, mkdirSync } from 'fs';

let db = null;
const dbPath = './database';
const filePath = './database/actividad.json';

let isSaving = false;
let writeQueue = Promise.resolve();

async function loadDatabase() {
    if (db) return db;
    try {
        if (!existsSync(dbPath)) {
            mkdirSync(dbPath, { recursive: true });
        }
        if (existsSync(filePath)) {
            const fileData = await fsPromises.readFile(filePath, 'utf-8');
            db = fileData ? JSON.parse(fileData) : {};
        } else {
            db = {};
        }
    } catch (error) {
        db = {};
    }
    return db;
}

function saveDatabase() {
    writeQueue = writeQueue.then(async () => {
        try {
            if (db) {
                const tempPath = `${filePath}.tmp`;
                await fsPromises.writeFile(tempPath, JSON.stringify(db, null, 2), 'utf-8');
                await fsPromises.rename(tempPath, filePath);
            }
        } catch (err) {
            console.error('Error al guardar la base de datos de actividad:', err);
        }
    });
    return writeQueue;
}

function detectarTipoMensaje(m) {
    const msg = m.message || {};
    const mType = m.mtype || '';

    if (mType === 'imageMessage' || msg.imageMessage) {
        return 'imagen';
    }
    if (mType === 'videoMessage' || msg.videoMessage) {
        return 'video';
    }
    if (mType === 'audioMessage' || msg.audioMessage) {
        return 'audio';
    }
    if (mType === 'stickerMessage' || msg.stickerMessage) {
        return 'sticker';
    }
    if (
        mType === 'conversation' ||
        mType === 'extendedTextMessage' ||
        msg.conversation ||
        msg.extendedTextMessage
    ) {
        return 'texto';
    }

    return null;
}

export const gCommand = {
    commands: {
        g: {
            name: 'logger_actividad',
            async before(m) {
                if (!m.isGroup || m.fromMe || m.isBaileys) return false;

                const currentDb = await loadDatabase();
                const senderJid = m.sender ? `${m.sender.split('@')[0].split(':')[0]}@s.whatsapp.net` : null;

                if (!senderJid) return false;

                if (!currentDb[m.chat]) currentDb[m.chat] = {};
                if (!currentDb[m.chat][senderJid]) {
                    currentDb[m.chat][senderJid] = {
                        texto: 0,
                        imagen: 0,
                        video: 0,
                        audio: 0,
                        sticker: 0,
                        total: 0
                    };
                }

                const userStats = currentDb[m.chat][senderJid];
                const tipoDetectado = detectarTipoMensaje(m);

                if (tipoDetectado && userStats[tipoDetectado] !== undefined) {
                    userStats[tipoDetectado] += 1;
                    userStats.total += 1;
                    saveDatabase();
                }

                return false;
            }
        }
    }
};
*/