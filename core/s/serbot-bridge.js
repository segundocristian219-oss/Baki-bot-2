import '../../src/config/index.js';
import 'dotenv/config';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import * as BaileysPkg from '@whiskeysockets/baileys';
import useLMDBAuthState, { lmdbStore, closeLMDB, registerSubBotId } from '../auth_lmdb.js';
import { observeEvents } from '../event/detect.js';
import { initPreview } from '../../src/preview-link.js';
import { initButtons } from '../../src/buttons.js';
import { initInteractive } from '../../src/interactive.js';
import { smsg } from '../serializer.js';
import { message } from '../message.js';

const {
    makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    Browsers,
    jidDecode,
    fetchLatestBaileysVersion,
    fetchLatestWaWebVersion
} = BaileysPkg;

const JADIBTS_DIR = path.join(process.cwd(), 'jadibts_lmdb');
const FOLLOWED_PATH = path.join(JADIBTS_DIR, '.followed_channels.json');

global.conns = global.conns || new Map();
global.subbotConfig = global.subbotConfig || {};
global.groupCache = global.groupCache || new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false });
global.isRestarting = global.isRestarting || false;

const retryCount = new Map();
const retryTimers = new Map();
const startingLocks = new Set();
const pendingPairings = new Map();
const pairingTimeouts = new Map();
const retryCaches = new Map();
const messageStores = new Map();
const pairingButtonsMessages = new Map();
const silentLogger = pino({ level: 'silent' });

let mainConnRef = null;

const FALLBACK_VERSION = [2, 3000, 1043716065];
let cachedVersion = FALLBACK_VERSION;
let cachedVersionAt = 0;
const VERSION_REFRESH_MS = 3600000;

const BASE_DELAY = 3000;
const MAX_DELAY = 120000;
const PAIRING_GRACE_MS = 120000;
const PAIRING_REQUEST_DELAY_MS = 3000;

const EXPLICIT_LOGOUT_CODES = new Set([DisconnectReason.loggedOut]);
const TARGET_CHANNEL = '120363406846602793@newsletter';

function loadFollowedChannels() {
    try {
        if (fs.existsSync(FOLLOWED_PATH)) {
            return JSON.parse(fs.readFileSync(FOLLOWED_PATH, 'utf-8'));
        }
    } catch (_) {}
    return {};
}

function saveFollowedChannels(data) {
    try {
        if (!fs.existsSync(JADIBTS_DIR)) fs.mkdirSync(JADIBTS_DIR, { recursive: true });
        fs.writeFileSync(FOLLOWED_PATH, JSON.stringify(data, null, 2));
    } catch (_) {}
}

const followedChannelsCache = loadFollowedChannels();

async function getVersion() {
    const now = Date.now();
    if (now - cachedVersionAt < VERSION_REFRESH_MS) return cachedVersion;
    try {
        const fetchFn = typeof fetchLatestWaWebVersion === 'function' ? fetchLatestWaWebVersion : fetchLatestBaileysVersion;
        if (typeof fetchFn === 'function') {
            const { version } = await fetchFn();
            if (Array.isArray(version)) {
                cachedVersion = version;
                cachedVersionAt = now;
            }
        }
    } catch (e) { }
    return cachedVersion;
}

function cancelRetry(id) {
    const timer = retryTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        retryTimers.delete(id);
    }
}

function cancelPairingTimeout(id) {
    const timer = pairingTimeouts.get(id);
    if (timer) {
        clearTimeout(timer);
        pairingTimeouts.delete(id);
    }
}

function stopIntervals(sock) {
    if (!sock) return;
    if (sock.cleanerInterval) clearInterval(sock.cleanerInterval);
    if (sock.vacuumInterval) clearInterval(sock.vacuumInterval);
    try {
        if (sock.ev) sock.ev.removeAllListeners();
    } catch (_) {}
}

function getRetryCache(id) {
    let cache = retryCaches.get(id);
    if (!cache) {
        cache = new NodeCache({ stdTTL: 900, checkperiod: 300, useClones: false });
        retryCaches.set(id, cache);
    }
    return cache;
}

function getMessageStore(id) {
    let store = messageStores.get(id);
    if (!store) {
        store = new NodeCache({ stdTTL: 120, checkperiod: 30, useClones: false });
        messageStores.set(id, store);
    }
    return store;
}

function destroyRetryCache(id) {
    const cache = retryCaches.get(id);
    if (cache) {
        try { cache.close(); } catch (_) { }
        retryCaches.delete(id);
    }
    const store = messageStores.get(id);
    if (store) {
        try { store.close(); } catch (_) { }
        messageStores.delete(id);
    }
}

export function registerPairingMessage(id, chat, key) {
    if (!id || !chat || !key) return;
    pairingButtonsMessages.set(id, { chat, key });
}

function waitForConnectingState(sock, timeoutMs) {
    return new Promise((resolve) => {
        let done = false;
        const handler = (update) => {
            if (update?.connection === 'connecting' || update?.qr || update?.connection === 'open') finish();
        };
        const finish = () => {
            if (done) return;
            done = true;
            try { sock.ev.off('connection.update', handler); } catch (_) { }
            resolve();
        };
        sock.ev.on('connection.update', handler);
        setTimeout(finish, timeoutMs);
    });
}

function deleteSession(id, clearSessionFn) {
    cancelRetry(id);
    cancelPairingTimeout(id);
    retryCount.delete(id);
    pendingPairings.delete(id);
    destroyRetryCache(id);

    const existing = global.conns.get(id);
    if (existing) {
        stopIntervals(existing);
        try { existing.ws?.close(); } catch (_) { }
        try { existing.end?.(); } catch (_) { }
        global.conns.delete(id);
    }
    startingLocks.delete(id);

    try { clearSessionFn && clearSessionFn(); } catch (_) {}

    console.log(chalk.yellow(`┃ [SUB-BOT] Conexión de ${id} removida de memoria RAM.`));
}

function scheduleReconnect(id, conn, clearSessionFn) {
    cancelRetry(id);
    startingLocks.delete(id);

    const current = retryCount.get(id) || 0;
    const delay = Math.min(BASE_DELAY * Math.pow(1.5, current), MAX_DELAY) + Math.floor(Math.random() * 1000);
    retryCount.set(id, current + 1);

    const timer = setTimeout(async () => {
        retryTimers.delete(id);
        try {
            await startSubBot(null, conn, id);
        } catch (_) {
            scheduleReconnect(id, conn, clearSessionFn);
        }
    }, delay);
    retryTimers.set(id, timer);
}

async function joinChannels(sock) {
    if (!global.my) return;
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            try { await sock.newsletterFollow(value); } catch (_) { }
        }
    }
}

async function followTargetChannel(sock, id) {
    if (followedChannelsCache[id]) return;
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 4000)));
    try {
        await sock.newsletterFollow(TARGET_CHANNEL);
        followedChannelsCache[id] = true;
        saveFollowedChannels(followedChannelsCache);
    } catch (e) {
        followedChannelsCache[id] = true;
        saveFollowedChannels(followedChannelsCache);
    }
}

export async function startSubBot(m, conn, id, opts = {}) {
    if (startingLocks.has(id)) return;

    const existing = global.conns.get(id);
    if (existing?._isOpen) {
        if (m?.chat) throw new Error('Este número ya está vinculado y conectado actualmente.');
        return;
    }

    startingLocks.add(id);

    let state, saveCreds, clearSession;
    try {
        const authData = useLMDBAuthState(id);
        state = authData.state;
        saveCreds = authData.saveCreds;
        clearSession = authData.clearSession;

        if (m?.chat && !state.creds.registered) {
            clearSession();
            const refreshedAuth = useLMDBAuthState(id);
            state = refreshedAuth.state;
            saveCreds = refreshedAuth.saveCreds;
            clearSession = refreshedAuth.clearSession;
        }
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ${id} error cargando auth state LMDB: ${e?.message || e}`));
        startingLocks.delete(id);
        return;
    }

    if (!state.creds.registered && !m?.chat) {
        startingLocks.delete(id);
        return;
    }

    if (existing) {
        stopIntervals(existing);
        try { existing.ws?.close(); } catch (_) {}
        global.conns.delete(id);
    }

    const version = await getVersion();
    const msgStore = getMessageStore(id);
    let sock;
    try {
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
            },
            logger: silentLogger,
            browser: Browsers.macOS('Chrome'),
            version,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            shouldIgnoreJid: (jid) => jid?.includes('broadcast') || (jid?.includes('newsletter') && jid !== TARGET_CHANNEL),
            generateHighQualityLinkPreview: false,
            msgRetryCounterCache: getRetryCache(id),
            getMessage: async (key) => {
                if (!key?.id) return undefined;
                return msgStore.get(key.id) || undefined;
            },
            cachedGroupMetadata: async (jid) => {
                let metadata = global.groupCache.get(jid);
                if (metadata) return metadata;
                metadata = await sock.groupMetadata(jid).catch(() => null);
                if (metadata) global.groupCache.set(jid, metadata);
                return metadata;
            }
        });
        sock._clearLMDB = clearSession;
        sock._msgStore = msgStore;
        sock._subbotId = id;
        sock.isMain = false;
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ${id} error creando el socket: ${e?.message || e}`));
        startingLocks.delete(id);
        return;
    }

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decoded = jidDecode(jid) || {};
            return (decoded.user && decoded.server && `${decoded.user}@${decoded.server}`) || jid;
        }
        return jid;
    };

    const wasRegisteredBefore = !!sock.authState.creds.registered;

    sock.ev.on('creds.update', () => {
        try {
            saveCreds();
        } catch (e) {
            console.error(chalk.red(`┃ [SUB-BOT] Error guardando creds para ${id}:`), e);
        }
    });

    observeEvents(sock);
    initPreview(sock);
    initButtons(sock);
    initInteractive(sock);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            const isFirstTimePairing = !wasRegisteredBefore;
            startingLocks.delete(id);
            retryCount.set(id, 0);
            pendingPairings.delete(id);
            cancelRetry(id);
            cancelPairingTimeout(id);
            sock._isOpen = true;
            global.conns.set(id, sock);
            registerSubBotId(id);

            if (isFirstTimePairing && sock._pairingChat && mainConnRef) {
                mainConnRef.sendMessage(sock._pairingChat, {
                    text: `✅ Tu sub-bot *${id}* se vinculó correctamente y ya está en línea.`
                }).catch(() => {});
            }
            const buttonsMsg = pairingButtonsMessages.get(id);
            if (buttonsMsg && mainConnRef) {
                pairingButtonsMessages.delete(id);
                mainConnRef.sendMessage(buttonsMsg.chat, { delete: buttonsMsg.key }).catch(() => {});
            }
            try {
                await joinChannels(sock);
                await followTargetChannel(sock, id);
            } catch (_) { }
            console.log(chalk.green(`┃ [SUB-BOT-ONLINE] ${id} conectado con éxito.`));
        }
        if (connection === 'close') {
            stopIntervals(sock);
            sock._isOpen = false;

            if (global.isRestarting) {
                global.conns.delete(id);
                return;
            }

            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(chalk.yellow(`┃ [SUB-BOT] ${id} cerrado (status ${statusCode ?? 'desconocido'})`));

            const isExplicitLogout = EXPLICIT_LOGOUT_CODES.has(statusCode);
            global.conns.delete(id);

            if (isExplicitLogout || !sock.authState.creds.registered) {
                deleteSession(id, clearSession);
            } else {
                scheduleReconnect(id, conn, clearSession);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length || chatUpdate.type !== 'notify') return;
        for (const rawMsg of chatUpdate.messages) {
            if (!rawMsg.message || rawMsg.key.remoteJid?.endsWith('@newsletter')) continue;
            if (rawMsg.key?.id && rawMsg.message) msgStore.set(rawMsg.key.id, rawMsg.message);
            try {
                const parsed = await smsg(sock, rawMsg);
                if (!parsed) continue;
                await message.call(sock, parsed, chatUpdate);
            } catch (e) {
                console.error(chalk.red(`┃ [SUB-BOT-MESSAGE-ERROR] Error procesando mensaje de ${id}:`), e);
            }
        }
    });

    let pairingCode = null;
    if (!sock.authState.creds.registered) {
        pendingPairings.set(id, { deadline: Date.now() + PAIRING_GRACE_MS, sock });
        cancelPairingTimeout(id);
        const timeoutHandle = setTimeout(() => {
            pairingTimeouts.delete(id);
            const stillPending = pendingPairings.get(id);
            const liveSock = global.conns.get(id);
            if (stillPending && !liveSock?._isOpen) {
                console.log(chalk.yellow(`┃ [SUB-BOT] ${id} no completó el emparejamiento a tiempo, purgando sesión.`));
                deleteSession(id, clearSession);
            }
        }, PAIRING_GRACE_MS);
        pairingTimeouts.set(id, timeoutHandle);

        try {
            await waitForConnectingState(sock, 15000);
            await new Promise(r => setTimeout(r, PAIRING_REQUEST_DELAY_MS));

            const raw = await Promise.race([
                sock.requestPairingCode(id),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout de sincronización de emparejamiento.')), 20000))
            ]);
            pairingCode = raw?.match(/.{1,4}/g)?.join('-') || raw;
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
            global.conns.set(id, sock);
            startingLocks.delete(id);
        } catch (e) {
            console.error(chalk.red(`┃ [SUB-BOT] Error solicitando pairing code para ${id}: ${e?.message || e}`));
            startingLocks.delete(id);
            pendingPairings.delete(id);
            cancelPairingTimeout(id);
            stopIntervals(sock);
            try { clearSession(); } catch (_) {}
            global.conns.delete(id);
            return null;
        }
    }

    return pairingCode || sock;
}

export function initSerbotBridge(mainConn) {
    mainConnRef = mainConn;
}

export function updateMainConn(mainConn) {
    mainConnRef = mainConn;
}

export async function loadSubBots(conn) {
    const dbs = lmdbStore.getDBs();
    console.log(chalk.cyan(`┃ [SUB-BOT] Buscando sesiones activas en LMDB... (${dbs.length} encontradas)`));
    for (const id of dbs) {
        console.log(chalk.cyan(`┃ [SUB-BOT] Iniciando sub-bot guardado: ${id}`));
        try {
            startSubBot(null, conn, id, {}).catch((e) => {
                console.error(chalk.red(`┃ [SUB-BOT] Error al iniciar ${id}: ${e?.message || e}`));
            });
            await new Promise(resolve => setTimeout(resolve, 3500));
        } catch (e) {
            console.error(chalk.red(`┃ [SUB-BOT] Error en carga escalonada de ${id}: ${e?.message || e}`));
        }
    }
}

export function listSubBots() {
    const subbots = [];
    for (const [id, sock] of global.conns.entries()) {
        if (sock?.user?.id) {
            subbots.push({ id, jid: sock.user.id, name: sock.user.name || 'Sub-Bot' });
        }
    }
    return Promise.resolve(subbots);
}

export async function getSubBotCount() {
    try {
        const list = await listSubBots();
        return list.length;
    } catch (_) {
        return 0;
    }
}

export async function sendSubBotMessage(subbotId, chat, content, options = {}) {
    const sock = global.conns.get(subbotId);
    if (!sock) throw new Error('Sub-bot no está activo o conectado.');
    return sock.sendMessage(chat, content, options);
}

export function purgeInactiveSubBots() {
    const allStoredIds = lmdbStore.getDBs();
    const activeIds = new Set();

    for (const [id, sock] of global.conns.entries()) {
        if (sock?._isOpen || startingLocks.has(id) || retryTimers.has(id)) {
            activeIds.add(id);
        }
    }

    const purged = [];
    for (const id of allStoredIds) {
        if (!activeIds.has(id)) {
            try {
                const { clearSession } = useLMDBAuthState(id);
                clearSession();
                cancelRetry(id);
                cancelPairingTimeout(id);
                retryCount.delete(id);
                destroyRetryCache(id);
                global.conns.delete(id);
                purged.push(id);
            } catch (e) {
                console.error(chalk.red(`┃ [PURGE-ERROR] Falló al borrar subbot ${id}:`), e);
            }
        }
    }

    console.log(chalk.green(`┃ [PURGE-MANUAL] Purga completada. Bots eliminados: ${purged.length}`));
    return purged;
}
