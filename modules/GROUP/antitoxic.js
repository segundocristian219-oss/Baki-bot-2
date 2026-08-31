import { jidNormalizedUser } from '@whiskeysockets/baileys';

const TOXIC_WORDS = [
    // Groserías directas
    'puto', 'puta', 'pendejo', 'pendeja', 'maldito', 'maldita',
    'estupido', 'estupida', 'imbecil', 'cabron', 'cabrona',
    'maricon', 'perra', 'verga', 'mierda', 'chinga', 'chupa',
    'pene', 'vagina', 'concha', 'bastardo', 'mamon', 'mamona',
    'culero', 'culera', 'zorra', 'joto', 'prostituta',

    // Abreviaciones y jerga
    'alv', 'ctm', 'pqp', 'tmr', 'mrd', 'hp', 'wtnf', 'ffs',
    'plp', 'cqo', 'cdll', 'nqv', 'lpm'
];

const MAX_WARNS = 3;

export const antiToxicModule = {
    category: 'GROUP',
    commands: {
        antitoxic_pro: {
            name: 'antitoxic',
            alias: [],
            async before(m, { conn, isOwner, chat }) {
                try {
                    if (!m.isGroup || !chat?.antiToxic || isOwner || m.fromMe) return false;

                    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
                    if (!groupMetadata) return false;

                    const participant = groupMetadata.participants.find(p => p.id === m.sender);
                    const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

                    if (isAdmin) return false;

                    const text = (m.text || '').toLowerCase();
                    if (!text) return false;

                    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    const esToxico = TOXIC_WORDS.some(word => {
                        const regex = new RegExp(`\\b${word}\\b`, 'i');
                        return regex.test(normalizedText);
                    });

                    if (!esToxico) return false;

                    const botId = jidNormalizedUser(conn.user.id);
                    const botParticipant = groupMetadata.participants.find(p => p.id === botId);
                    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                    if (isBotAdmin) {
                        await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                    }

                    const userJid = m.sender;

                    let groupData = null;
                    if (global.Chat) {
                        groupData = await global.Chat.findOne({ id: m.chat }).catch(() => null);
                    }

                    let currentWarns = 1;

                    if (groupData) {
                        groupData.warns = groupData.warns || [];
                        let userWarnObj = groupData.warns.find(w => w.id === userJid);

                        if (!userWarnObj) {
                            userWarnObj = { id: userJid, count: 1 };
                            groupData.warns.push(userWarnObj);
                        } else {
                            userWarnObj.count += 1;
                        }

                        currentWarns = userWarnObj.count;

                        if (currentWarns >= MAX_WARNS) {
                            userWarnObj.count = 0;
                        }

                        groupData.markModified('warns');
                        await groupData.save().catch(() => null);
                    }

                    if (currentWarns >= MAX_WARNS) {
                        if (isBotAdmin) {
                            await new Promise(r => setTimeout(r, 500));
                            await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove').catch(() => null);
                            await conn.sendMessage(m.chat, {
                                text: `*» EXPULSIÓN POR TOXICIDAD «*\n\n` +
                                      `• *Usuario* : @${userJid.split('@')[0]}\n` +
                                      `• *Razón* : Acumular ${MAX_WARNS}/${MAX_WARNS} advertencias por lenguaje inapropiado.`,
                                mentions: [userJid]
                            });
                        } else {
                            await conn.sendMessage(m.chat, {
                                text: `*» LÍMITE DE WARNS ALCANZADO «*\n\n` +
                                      `• *Usuario* : @${userJid.split('@')[0]}\n` +
                                      `• *Advertencias* : ${MAX_WARNS}/${MAX_WARNS}\n` +
                                      `• *Nota* : No se pudo expulsar porque el bot no es administrador.`,
                                mentions: [userJid]
                            });
                        }
                    } else {
                        await conn.sendMessage(m.chat, {
                            text: `*» ADVERTENCIA DE TOXICIDAD «*\n\n` +
                                  `• *Usuario* : @${userJid.split('@')[0]}\n` +
                                  `• *Advertencias* : ${currentWarns}/${MAX_WARNS}\n` +
                                  `• *Nota* : Si alcanzas ${MAX_WARNS} advertencias serás expulsado del grupo.`,
                            mentions: [userJid]
                        });
                    }

                    return true;
                } catch (e) {
                    console.error('Error en Anti-Toxic:', e);
                }
                return false;
            }
        }
    }
};
