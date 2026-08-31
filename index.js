import './src/config/index.js';
import 'dotenv/config';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import { watch, promises as fsP } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import NodeCache from 'node-cache';
import readline from 'readline';
import yargs from 'yargs';
import { Boom } from '@hapi/boom';
import { makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';

import { smsg } from './core/serializer.js';
import { cacheManager } from './core/cache.js';
import { observeEvents } from './core/event/detect.js';
import { initPreview } from './src/preview-link.js';
import { initButtons } from './src/buttons.js';
import { initInteractive } from './src/interactive.js';
import { initGlobals } from './src/utils/globals.js';
import { initSerbotBridge, updateMainConn, loadSubBots } from './core/s/serbot-bridge.js';

import { databaseManager } from './database/db_adapter.js';

const FILTERED_LOGS = [
    'Closing session',
    'Removing old closed session',
    'Closing open session in favor of incoming prekey bundle',
    'Bad MAC',
    'Failed to decrypt message with any known session',
    'MessageCounterError',
    'Decrypted message with closed session',
    'Session error',
    'Connection Closed',
    'Connection Failure',
    'connect ECONNREFUSED',
    'socket hang up',
    'ECONNRESET',
];

const startingLocks = new Set();

const maskLogs = (chunk, encoding, callback, originalWrite) => {
    const msg = chunk?.toString?.() || '';
    if (FILTERED_LOGS.some(f => msg.includes(f))) {
        if (typeof encoding === 'function') encoding();
        else if (typeof callback === 'function') callback();
        return true;
    }
    return originalWrite(chunk, encoding, callback);
};

const _stdout = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => maskLogs(chunk, encoding, callback, _stdout);
const _stderr = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => maskLogs(chunk, encoding, callback, _stderr);

if (!global.__process_events_initialized) {
    process.removeAllListeners('warning');
    process.setMaxListeners(20);

    const flushData = async () => {
        if (global._flushing) return;
        global._flushing = true;
        if (global.dirtyUsers && global.dirtyUsers.size > 0) {
            const usersToSave = Array.from(global.dirtyUsers);
            global.dirtyUsers.clear();
            const dataArray = usersToSave.map(jid => global.userCache.get(jid)).filter(Boolean);
            try {
                if (dataArray.length > 0) await databaseManager.saveUsersBulk(dataArray);
            } catch (_) {}
        }
        process.exit(0);
    };

    process.on('SIGINT', flushData);
    process.on('SIGTERM', flushData);

    process.on('uncaughtException', (err) => {
        const msg = err?.message || '';
        if (FILTERED_LOGS.some(f => msg.includes(f))) return;
        console.error('[uncaughtException]', err?.stack || err);
    });

    process.on('unhandledRejection', (reason) => {
        const msg = reason instanceof Error ? reason.message : String(reason);
        if (FILTERED_LOGS.some(f => msg.includes(f))) return;
        console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : msg);
    });

    global.__process_events_initialized = true;
}

global.groupCache = cacheManager.cache;
global.conns = global.conns || new Map();

const sId = (jid) => {
    if (!jid) return jid;
    const index = jid.indexOf('@');
    if (index !== -1) {
        const user = jid.slice(0, index);
        const splitCol = user.indexOf(':');
        return (splitCol !== -1 ? user.slice(0, splitCol) : user) + '@s.whatsapp.net';
    }
    const splitCol = jid.indexOf(':');
    return (splitCol !== -1 ? jid.slice(0, splitCol) : jid) + '@s.whatsapp.net';
};

global.userCache = new Map();
global.dirtyUsers = new Set();

global.updateUser = (jid, data) => {
    const currentData = global.userCache.get(jid) || {};
    const updatedData = { ...currentData, ...data, id: jid, lastActive: Date.now() };
    global.userCache.set(jid, updatedData);
    global.dirtyUsers.add(jid);
    return updatedData;
};

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);
const originalError = console.error;
console.error = (...args) => {
    args.forEach(arg => {
        if (arg instanceof Error) originalError.apply(console, [chalk.red('┗ ERROR:'), arg.stack]);
        else originalError.apply(console, [chalk.red('┗'), arg]);
    });
};

console.log(chalk.cyan('┃ ') + chalk.bold('KIRITO — starting'));

await fsP.mkdir('./database', { recursive: true }).catch(() => {});
await fsP.mkdir('./tmp', { recursive: true }).catch(() => {});
await fsP.mkdir('./sessions', { recursive: true }).catch(() => {});

await databaseManager.init();

if (global._dbSaveInterval) clearInterval(global._dbSaveInterval);
let _isSavingDB = false;
global._dbSaveInterval = setInterval(async () => {
    const sweepCache = () => {
        if (global.userCache.size > 2000) {
            const now = Date.now();
            for (const [jid, data] of global.userCache.entries()) {
                if (now - (data.lastActive || 0) > 3600000 && !global.dirtyUsers.has(jid)) {
                    global.userCache.delete(jid);
                }
            }
        }
    };
    if (global.dirtyUsers.size === 0) { sweepCache(); return; }
    if (_isSavingDB) return;
    _isSavingDB = true;
    const usersToSave = Array.from(global.dirtyUsers);
    global.dirtyUsers.clear();
    const dataArray = usersToSave.map(jid => global.userCache.get(jid)).filter(Boolean);
    try {
        if (dataArray.length > 0) await databaseManager.saveUsersBulk(dataArray);
        sweepCache();
    } catch (_) {
        usersToSave.forEach(jid => global.dirtyUsers.add(jid));
    } finally {
        _isSavingDB = false;
    }
}, 15000);

const sessionDir = './sessions/main';

const cleanDeviceList = async (maxFiles = 500) => {
    try {
        const files = await fsP.readdir(sessionDir).catch(() => []);
        const deviceFiles = files.filter(f => f.startsWith('device-list-'));
        if (deviceFiles.length <= maxFiles) return;
        const withStats = await Promise.all(
            deviceFiles.map(async f => {
                const fp = path.join(sessionDir, f);
                const stat = await fsP.stat(fp).catch(() => null);
                return { path: fp, mtime: stat?.mtimeMs || 0 };
            })
        );
        withStats.sort((a, b) => a.mtime - b.mtime);
        const toDelete = withStats.slice(0, withStats.length - maxFiles);
        await Promise.all(toDelete.map(f => fsP.unlink(f.path).catch(() => {})));
    } catch (_) {}
};

await cleanDeviceList();
if (global._cleanDeviceInterval) clearInterval(global._cleanDeviceInterval);
global._cleanDeviceInterval = setInterval(cleanDeviceList, 6 * 60 * 60 * 1000);

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') =>
    rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathURL;
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
const version = [2, 3000, 1043716065];
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const connectionOptions = {
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '124.0.0.0'],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    emitOwnEvents: false,
    msgRetryCounterCache,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 30000,
    getMessage: async () => undefined
};

global.conn = makeWASocket(connectionOptions);
initPreview(global.conn);
initButtons(global.conn);
initInteractive(global.conn);
initGlobals(global.conn);
global.conn.ev.on('creds.update', saveCreds);
global.conn.isMain = true;
global.conns.set('main', global.conn);
global._reconnectAttempts = 0;
let _authFailedAttempts = 0;
let _disableMainBot = false;
const MAX_RECONNECT_DELAY = 60000;
const MAX_RECONNECT_ATTEMPTS = 50;
let _reconnectTimer = null;
let _isReconnecting = false;

function getReconnectDelay() {
    const base = Math.min(10000 * (global._reconnectAttempts + 1), MAX_RECONNECT_DELAY);
    const jitter = base * (0.8 + Math.random() * 0.4);
    global._reconnectAttempts++;
    return Math.round(jitter);
}

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + 'Número: ');
    let addNumber = phoneNumber.replace(/\D/g, '');
    rl.close();
    setTimeout(async () => {
        try {
            let codeBot = await global.conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.bgBlack.white.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join('-') || codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

let messageHandlerMain;

const loadCoreRouter = async () => {
    try {
        const PathMain = path.join(process.cwd(), 'core/message.js');
        const moduleMain = await import(`file://${PathMain}?update=${Date.now()}`);
        messageHandlerMain = moduleMain.message || moduleMain.default?.message || moduleMain.default;
    } catch (e) { console.error(e); }
};

function debounce(fn, ms) {
    let t = null;
    return (...args) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

await loadCoreRouter();
watch(path.join(process.cwd(), 'core/message.js'), debounce(loadCoreRouter, 300));

global.reload = async function (restatConn) {
    if (_disableMainBot) return;
    if (startingLocks.has('main')) return;
    if (_isReconnecting && restatConn) return;

    if (restatConn) {
        if (global._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(chalk.red.bold(`┃ Se alcanzó el máximo de ${MAX_RECONNECT_ATTEMPTS} reintentos. Deteniendo reconexión automática.`));
            _disableMainBot = true;
            return;
        }
        startingLocks.add('main');
        _isReconnecting = true;
        try {
            if (global.conn?.ev) {
                global.conn.ev.removeAllListeners('messages.upsert');
                global.conn.ev.removeAllListeners('connection.update');
                global.conn.ev.removeAllListeners('groups.update');
            }
            if (global.conn?.ws) global.conn.ws.close();
        } catch (_) {}
        try { if (global.conn?.end) global.conn.end(new Error('Reconnection Execution')); } catch (_) {}
        await new Promise(r => setTimeout(r, 1000));
        await cleanDeviceList(200);
        await new Promise(r => setTimeout(r, 500));
        const { state: newState, saveCreds: newSaveCreds } = await useMultiFileAuthState(sessionDir);
        global.conn = makeWASocket({
            ...connectionOptions,
            auth: {
                creds: newState.creds,
                keys: makeCacheableSignalKeyStore(newState.keys, pino({ level: 'silent' })),
            }
        });
        initPreview(global.conn);
        initButtons(global.conn);
        initInteractive(global.conn);
        initGlobals(global.conn);
        global.conn.ev.on('creds.update', newSaveCreds);
        global.conn.isMain = true;
        global.conns.set('main', global.conn);
        _isReconnecting = false;
        startingLocks.delete('main');
    }

    global.conn.ev.removeAllListeners('messages.upsert');
    observeEvents(global.conn);
    global.conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return;
        const msg = chatUpdate.messages[0];
        if (!msg) return;
        Promise.resolve().then(async () => {
            try {
                const m = await smsg(global.conn, msg);
                if (!m) return;
                if (typeof messageHandlerMain === 'function') {
                    await messageHandlerMain.call(global.conn, m, chatUpdate);
                }
            } catch (e) {
                const em = e?.message || '';
                if (!FILTERED_LOGS.some(f => em.includes(f))) console.error('[messages.upsert]', e);
            }
        });
    });

    global.conn.ev.removeAllListeners('connection.update');
    global.conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
            console.error(chalk.yellow(`┃ DESCONECTADO (código ${reason})`));

            if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 403) {
                _authFailedAttempts++;
                console.error(chalk.red(`┃ Fallo de autenticación/baneo (${_authFailedAttempts}/2)`));
                if (_authFailedAttempts >= 2) {
                    _disableMainBot = true;
                    console.error(chalk.red.bold('┃ BOT BANEADO/DESCONECTADO PERMANENTEMENTE. DETENIENDO REINTENTOS.'));
                    return;
                }
            }

            if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
            const delay = getReconnectDelay();
            console.log(chalk.cyan(`┃ Reintento #${global._reconnectAttempts} en ${Math.round(delay / 1000)}s...`));
            _reconnectTimer = setTimeout(() => { _reconnectTimer = null; global.reload(true); }, delay);
        }
        if (connection === 'open') {
            if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
            _isReconnecting = false;
            global._reconnectAttempts = 0;
            _authFailedAttempts = 0;
            global.botNumber = sId(global.conn.user.id);
            initGlobals(global.conn);
            updateMainConn(global.conn);
            await loadSubBots(global.conn);
            console.log(chalk.cyan('┃ ') + chalk.greenBright.bold('STATUS: ONLINE'));
            console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

            try {
                const groups = await global.conn.groupFetchAllParticipating().catch(() => ({}));
                for (const id in groups) {
                    cacheManager.updateParticipants(id, groups[id].participants);
                    global.groupCache.set(id, groups[id]);
                }
            } catch (_) {}
        }
    });

    global.conn.ev.removeAllListeners('groups.update');
    global.conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (!update?.id) continue;
            try {
                const metadata = await global.conn.groupMetadata(update.id).catch(() => null);
                if (metadata) {
                    global.groupCache.set(update.id, metadata);
                    cacheManager.updateParticipants(update.id, metadata.participants);
                }
            } catch (_) {}
        }
    });
};

await global.reload();

global.modules = new Map();
global.commands = new Map();
global.aliases = new Map();

const getFilesRecursive = async (dir) => {
    let results = [];
    try {
        const list = await fsP.readdir(dir).catch(() => []);
        for (const file of list) {
            const filePath = join(dir, file);
            const stat = await fsP.stat(filePath).catch(() => null);
            if (!stat) continue;
            if (stat.isDirectory()) {
                results = results.concat(await getFilesRecursive(filePath));
            } else if (file.endsWith('.js')) {
                results.push(filePath);
            }
        }
    } catch (_) {}
    return results;
};

let _reloadingModules = false;
global.reloadModules = async function (check) {
    if (_reloadingModules) return false;
    _reloadingModules = true;
    try {
        global.modules.clear();
        global.commands.clear();
        global.aliases.clear();

        const modulesDir = join(process.cwd(), './modules');
        const files = await getFilesRecursive(modulesDir);
        for (const filePath of files) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const imported = await import(`${fileUrl}?update=${Date.now()}`);
                const mod = imported.default || imported;

                for (const key in mod) {
                    const possibleGroup = mod[key];
                    if (possibleGroup && possibleGroup.commands) {
                        const moduleName = basename(filePath, '.js');
                        global.modules.set(moduleName, possibleGroup);
                        for (const cmdKey in possibleGroup.commands) {
                            const cmd = possibleGroup.commands[cmdKey];
                            cmd.category = possibleGroup.category || 'general';
                            global.commands.set(cmd.name, cmd);
                            if (cmd.alias && Array.isArray(cmd.alias)) {
                                cmd.alias.forEach(a => global.aliases.set(a, cmd.name));
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[module-load]', filePath, e.message);
            }
        }
        if (check) return true;
    } finally {
        _reloadingModules = false;
    }
};

await global.reloadModules();
initSerbotBridge(global.conn);
