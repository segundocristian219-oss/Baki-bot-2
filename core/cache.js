import { jidNormalizedUser } from '@whiskeysockets/baileys';

class CacheManager {
    constructor() {
        if (!global.groupCache) {
            global.groupCache = new Map();
        }
        if (!global.cacheTimestamps) {
            global.cacheTimestamps = new Map();
        }
        this.cache = global.groupCache;
        this.timestamps = global.cacheTimestamps;
        this.ttl = 30 * 60 * 1000;

        this._startCleaner();
    }

    _startCleaner() {
        if (global.cacheCleanerRunning) return;
        global.cacheCleanerRunning = true;

        setInterval(() => {
            const now = Date.now();
            for (const [jid, lastAccess] of this.timestamps.entries()) {
                if (now - lastAccess > this.ttl) {
                    this.cache.delete(jid);
                    this.timestamps.delete(jid);
                }
            }
        }, 5 * 60 * 1000);
    }

    async get(conn, jid, force = false) {
        if (!jid || !jid.endsWith('@g.us')) return {};

        if (!force && this.cache.has(jid)) {
            this.timestamps.set(jid, Date.now());
            return this.cache.get(jid);
        }

        try {
            const data = await conn.groupMetadata(jid).catch(() => null);
            if (data?.id) {
                this.cache.set(jid, data);
                this.timestamps.set(jid, Date.now());
                return data;
            }
        } catch {
            const cached = this.cache.get(jid);
            if (cached) this.timestamps.set(jid, Date.now());
            return cached || {};
        }
        return {};
    }

    updateParticipants(jid, participants) {
        if (!jid || !participants) return;
        const data = this.cache.get(jid) || { id: jid };
        data.participants = participants;
        this.cache.set(jid, data);
        this.timestamps.set(jid, Date.now());
    }

    delete(jid) {
        this.cache.delete(jid);
        this.timestamps.delete(jid);
    }

    getAdminStatus(jid, userJid, authorJid = null) {
        const data = this.cache.get(jid);
        if (!data?.participants) return false;

        this.timestamps.set(jid, Date.now());

        const p = data.participants.find(p => 
            jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || 
            (authorJid && jidNormalizedUser(p.id) === jidNormalizedUser(authorJid)) ||
            (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(userJid))
        );
        return !!(p?.admin || p?.isCommunityAdmin);
    }
}

export const cacheManager = new CacheManager();