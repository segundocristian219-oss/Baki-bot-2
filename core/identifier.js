import { jidNormalizedUser } from '@whiskeysockets/baileys';

const metadataPromises = new Map();

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn?.user?.id);
    if (!target) return jidNormalizedUser(jid);

    if (target.endsWith('@s.whatsapp.net')) {
        return jidNormalizedUser(target);
    }

    if (target.endsWith('@lid')) {
        const sender = m?.key?.participant || m?.key?.remoteJid || m?.participant;
        if (target === sender) {
            if (m?.key?.remoteJidAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.remoteJidAlt);
            if (m?.key?.participantAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.participantAlt);
        }

        const chatId = m?.chat || m?.key?.remoteJid || m?.message?.remoteJid;
        if (chatId?.endsWith('@g.us')) {
            let metadata = global.groupCache?.get?.(chatId);
            if (!metadata && typeof conn?.groupMetadata === 'function') {
                if (metadataPromises.has(chatId)) {
                    metadata = await metadataPromises.get(chatId);
                } else {
                    const promise = conn.groupMetadata(chatId)
                        .then(res => {
                            metadataPromises.delete(chatId);
                            return res;
                        })
                        .catch(() => {
                            metadataPromises.delete(chatId);
                            return null;
                        });
                    metadataPromises.set(chatId, promise);
                    metadata = await promise;
                }
            }
            if (metadata?.participants) {
                const participants = metadata.participants;
                const len = participants.length;
                for (let i = 0; i < len; i++) {
                    const p = participants[i];
                    if (p.id === target || p.lid === target) {
                        if (p.phoneNumber) {
                            const num = p.phoneNumber;
                            return jidNormalizedUser(num.includes('@') ? num : `${num}@s.whatsapp.net`);
                        }
                        if (p.id && !p.id.endsWith('@lid')) {
                            return jidNormalizedUser(p.id);
                        }
                        break;
                    }
                }
            }
        }
    }

    return jidNormalizedUser(target);
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions || !mentions.length) return [];
    const uniqueMentions = [...new Set(mentions)];
    const resolved = await Promise.all(uniqueMentions.map(jid => getRealJid(conn, jid, m)));
    return mentions.map(jid => resolved[uniqueMentions.indexOf(jid)]);
}

export function cleanNumber(jid) {
    if (!jid) return '';
    const index = jid.indexOf('@');
    const cleanStr = index !== -1 ? jid.slice(0, index) : String(jid);
    return cleanStr.replace(/\D/g, '');
}

global.getRealJid = getRealJid;
global.resolveMentions = resolveMentions;
global.cleanNumber = cleanNumber;