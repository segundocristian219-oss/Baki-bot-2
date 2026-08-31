global.antispamGroups = global.antispamGroups || {};
const spamMap = new Map();

const MAX_WARNS = 3;
const SPAM_THRESHOLD = 5;      // Se activa al intentar enviar 2 comandos
const SPAM_INTERVAL = 5000;    // En menos de 5 segundos
const COOLDOWN_TIME = 600000;  // Cooldown de 10 minutos

export const antiSpamModule = {
    category: 'GROUP',
    commands: {
        antispam: {
            name: 'antispam',
            alias: ['antispamfilter', 'filterspam'],
            desc: 'Activa o desactiva el filtro anti-spam en el grupo.',
            run: async (m, { args, isGroup }) => {
                const esUnGrupo = isGroup || m.isGroup || m.chat.endsWith('@g.us');
                if (!esUnGrupo) {
                    return m.reply('*» ALERTA* : Este comando solo se puede usar dentro de grupos.');
                }

                const option = args[0] ? args[0].toLowerCase() : null;

                if (option === 'off' || option === '0' || option === 'desactivar') {
                    global.antispamGroups[m.chat] = false;
                    spamMap.delete(m.chat);
                    return m.reply(
                        `*» CONFIGURACIÓN ANTI-SPAM «*\n\n` +
                        `• *Estado* : Desactivado ❌`
                    );
                }

                if (option === 'on' || option === '1' || option === 'activar') {
                    global.antispamGroups[m.chat] = true;
                    return m.reply(
                        
                        `*» CONFIGURACIÓN ANTI-SPAM «*\n\n` +
                        `• *Estado* : Activado ✅\n` +
                        `• *Límite* : 2 comandos en menos de 5s\n` +
                        `• *Excepciones* : Owners y Admins exentos\n` +
                        `• *Sanción por Spam* : Mute temporal de 10 min + Warn`
                    );
                }

                return m.reply(`*» CONFIGURACIÓN ANTI-SPAM «*\n\n` +
                    `• \`.antispam on\` : Activar filtro en este grupo\n` +
                    `• \`.antispam off\` : Desactivar filtro en este grupo`
                );
            },
            before: async function (m, { conn, isBotAdmin, isROwner, isAdmin }) {
                try {
                    if (!m.chat || !m.chat.endsWith('@g.us')) return false;
                    if (global.antispamGroups[m.chat] === false) return false;
                    if (m.isBaileys || m.fromMe) return false;

                    // Eximir a Owners y Admins
                    if (isROwner || isAdmin) return false;

                    const text = (m.text || '').trim();
                    if (!text) return false;

                    const activePrefixes = ['.', '#', '/', '!'];
                    const isCommand = activePrefixes.some(p => text.startsWith(p));
                    if (!isCommand) return false;

                    const now = Date.now();
                    const userKey = `${m.chat}-${m.sender}`;
                    const userData = spamMap.get(userKey) || { count: 0, lastTime: 0, cooldownUntil: 0 };

                    // Si el usuario está silenciado por spam
                    if (now < userData.cooldownUntil) {
                        if (isBotAdmin) {
                            await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                        }
                        return true; 
                    }

                    if (now - userData.lastTime < SPAM_INTERVAL) {
                        userData.count += 1;
                    } else {
                        userData.count = 1;
                    }

                    userData.lastTime = now;

                    if (userData.count >= SPAM_THRESHOLD) {
                        userData.cooldownUntil = now + COOLDOWN_TIME;
                        userData.count = 0;
                        spamMap.set(userKey, userData);

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
                                await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove').catch(() => null);
                                await conn.sendMessage(m.chat, {
                                    text: `*» EXPULSIÓN POR SPAM «*\n\n` +
                                          `• *Usuario* : @${userJid.split('@')[0]}\n` +
                                          `• *Razón* : Acumular ${MAX_WARNS}/${MAX_WARNS} advertencias por abuso de spam.`,
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
                                text: `*» DETECCIÓN DE SPAM «*\n\n` +
                                      `• *Usuario* : @${userJid.split('@')[0]}\n` +
                                      `• *Motivo* : 2 comandos enviados en menos de 5 segundos.\n` +
                                      `• *Sanción* : Comandos bloqueados durante 10 minutos.\n` +
                                      `• *Advertencias* : ${currentWarns}/${MAX_WARNS}\n` +
                                      `• *Nota* : Si alcanzas ${MAX_WARNS} advertencias serás expulsado.`,
                                mentions: [userJid]
                            });
                        }

                        return true;
                    }

                    spamMap.set(userKey, userData);
                } catch (e) {
                    console.error('Error en Anti-Spam:', e);
                }
                return false;
            }
        }
    }
};
