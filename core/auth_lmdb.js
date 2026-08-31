import path from 'path';
import fs from 'fs';
import { open } from 'lmdb';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';

const JADIBTS_DIR = path.resolve(process.cwd(), 'jadibts_lmdb');

if (!fs.existsSync(JADIBTS_DIR)) {
    fs.mkdirSync(JADIBTS_DIR, { recursive: true });
}

const rootDb = open({
    path: JADIBTS_DIR,
    compression: true,
    maxDbs: 200,
    overlappingSync: false
});

const indexDb = rootDb.openDB({
    name: '_subbots_index',
    encoding: 'json'
});

export function registerSubBotId(id) {
    try {
        const current = indexDb.get('active_list') || [];
        if (!current.includes(id)) {
            current.push(id);
            indexDb.putSync('active_list', current);
        }
    } catch (_) {}
}

function unregisterSubBotId(id) {
    try {
        const current = indexDb.get('active_list') || [];
        const filtered = current.filter(item => item !== id);
        indexDb.putSync('active_list', filtered);
    } catch (_) {}
}

export default function useLMDBAuthState(subbotId) {
    const dbName = `subbot_${subbotId}`;
    const db = rootDb.openDB({
        name: dbName,
        encoding: 'json'
    });

    let creds = db.get('creds');
    if (!creds) {
        creds = initAuthCreds();
        db.putSync('creds', JSON.parse(JSON.stringify(creds, BufferJSON.replacer)));
    } else {
        creds = JSON.parse(JSON.stringify(creds), BufferJSON.reviver);
    }

    const keys = {
        get: async (type, ids) => {
            const data = {};
            for (const id of ids) {
                const key = `${type}-${id}`;
                const val = db.get(key);
                if (val) {
                    data[id] = JSON.parse(JSON.stringify(val), BufferJSON.reviver);
                }
            }
            return data;
        },
        set: async (data) => {
            for (const category in data) {
                for (const id in data[category]) {
                    const value = data[category][id];
                    const key = `${category}-${id}`;
                    if (value) {
                        db.putSync(key, JSON.parse(JSON.stringify(value, BufferJSON.replacer)));
                    } else {
                        db.removeSync(key);
                    }
                }
            }
        }
    };

    return {
        state: {
            creds,
            keys
        },
        saveCreds: () => {
            db.putSync('creds', JSON.parse(JSON.stringify(creds, BufferJSON.replacer)));
        },
        clearSession: () => {
            try {
                db.dropSync();
                unregisterSubBotId(subbotId);
            } catch (_) {}
        }
    };
}

export const lmdbStore = {
    getDBs: () => {
        try {
            const list = indexDb.get('active_list');
            if (Array.isArray(list) && list.length > 0) {
                return list;
            }
            return [];
        } catch (_) {
            return [];
        }
    }
};

export function getLMDBDetails() {
    const subbotIds = lmdbStore.getDBs();
    const records = [];

    for (const id of subbotIds) {
        try {
            const dbName = `subbot_${id}`;
            const db = rootDb.openDB({ name: dbName, encoding: 'json' });

            const keys = Array.from(db.getKeys());
            const creds = db.get('creds');

            records.push({
                id,
                registered: creds ? !!creds.registered : false,
                keysCount: keys.length,
                keysSample: keys.slice(0, 5)
            });
        } catch (e) {
            records.push({
                id,
                error: e.message
            });
        }
    }

    return records;
}

export async function closeLMDB() {
    try {
        if (rootDb.flushed) {
            await rootDb.flushed;
        }
        rootDb.close();
    } catch (_) {}
}

process.on('SIGINT', async () => { await closeLMDB(); process.exit(0); });
process.on('SIGTERM', async () => { await closeLMDB(); process.exit(0); });
