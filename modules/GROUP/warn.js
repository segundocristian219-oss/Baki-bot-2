export const warnCommand = {
    category: 'group',
    commands: {
        warn: {
            name: 'warn',
            alias: ['advertir', 'delwarn', 'quitarwarn', 'warnlist', 'advertencias', 'warns'],
            group: true,
            run: async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {
                try {
                    let chatData = await global.Chat.findOne({ chatId: m.chat }) || {};
                    let limit = chatData.warnLimit || 3;

                    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
                    
                    let groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => ({})) : {};
                    let participants = groupMetadata.participants || [];
                    let targetUser = participants.find(p => p.id === who || p.lid === who) || { id: who };

                    let queryIds = [who];
                    if (targetUser.id) queryIds.push(targetUser.id);
                    if (targetUser.lid) queryIds.push(targetUser.lid);
                    queryIds = [...new Set(queryIds.filter(Boolean))];

                    let warnDoc = who ? await global.Warns.findOne({ groupId: m.chat, userId: { $in: queryIds } }) : null;

                    if (['warnlist', 'advertencias', 'warns'].includes(command)) {
                        if (who) {
                            if (!warnDoc || warnDoc.warnCount === 0) {
                                return conn.sendMessage(m.chat, { 
                                    text: `*─── [ ⚖ REGISTRO ] ───*\n\n_El usuario @${who.split('@')[0]} está limpio. No tiene advertencias._`, 
                                    mentions: [who] 
                                }, { quoted: m });
                            }

                            let detail = `*─── [ ⚖ EXPEDIENTE ] ───*\n\n`;
                            detail += `*👤 Usuario:* @${who.split('@')[0]}\n`;
                            detail += `*🛡 Estado:* ${warnDoc.warnCount}/${limit}\n\n`;
                            detail += `*◈ HISTORIAL:* \n`;

                            warnDoc.reasons.forEach((reason, i) => {
                                detail += `\n*${i + 1}.* ${reason}`;
                            });

                            detail += `\n\n*⚠️ Nota:* _Al llegar a ${limit} será expulsado._`;
                            return conn.sendMessage(m.chat, { text: detail, mentions: [who] }, { quoted: m });
                        }

                        let allWarns = await global.Warns.find({ groupId: m.chat });
                        if (allWarns.length === 0) {
                            return conn.sendMessage(m.chat, { text: `*─── [ ⍰ ESTADO ] ───*\n\n_No hay usuarios advertidos en este grupo._` }, { quoted: m });
                        }

                        let list = `*─── [ ⍰ USUARIOS ADVERTIDOS ] ───*\n\n`;
                        allWarns.forEach((w, i) => {
                            list += `*${i + 1}.* @${w.userId.split('@')[0]} ( ${w.warnCount}/${limit} )\n`;
                        });
                        list += `\n_Usa *${usedPrefix + command} @user* para ver el detalle._`;
                        return conn.sendMessage(m.chat, { text: list, mentions: allWarns.map(w => w.userId) }, { quoted: m });
                    }

                    if (!isAdmin) return global.dfail('admin', m, conn);
                    if (!who) {
                        return conn.sendMessage(m.chat, { 
                            text: `> *♛ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo]` 
                        }, { quoted: m });
                    }

                    let d = new Date();
                    let date = d.toLocaleDateString('es-HN');

                    if (command === 'warn' || command === 'advertir') {
                        if (!isBotAdmin) return global.dfail('botAdmin', m, conn);

                        if (!warnDoc) {
                            warnDoc = new global.Warns({ userId: who, groupId: m.chat, warnCount: 0, reasons: [] });
                        }

                        let reasonRaw = text ? text.replace(/@(\d+)/g, '').trim() : 'Sin motivo';
                        if (!reasonRaw) reasonRaw = 'Sin motivo';

                        let reasonWithMeta = `${reasonRaw} \n      *└ 📅 Fecha:* _${date}_`;

                        warnDoc.warnCount += 1;
                        warnDoc.reasons.push(reasonWithMeta); 

                        if (warnDoc.warnCount < limit) {
                            await warnDoc.save();
                            let txt = `*─── [ ▶ ADVERTENCIA ] ───*\n\n`;
                            txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                            txt += `*✰ Advertencias:* ${warnDoc.warnCount}/${limit}\n`;
                            txt += `*⍰ Motivo:* ${reasonRaw}\n\n`;
                            txt += `_Advertencia registrada correctamente._`;
                            await conn.sendMessage(m.chat, { text: txt, mentions: [who] }, { quoted: m });
                        } else {
                            await global.Warns.deleteOne({ _id: warnDoc._id });
                            let txt = `*─── [ ×᷼× EXPULSADO ] ───*\n\n`;
                            txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                            txt += `*✰ Motivo final:* ${reasonRaw}\n\n`;
                            txt += `_Superó el límite de ${limit} advertencias y ha sido eliminado._`;
                            await conn.sendMessage(m.chat, { text: txt, mentions: [who] }, { quoted: m });
                            await conn.groupParticipantsUpdate(m.chat, [targetUser.id || who], 'remove');
                        }
                    }
                    else if (command === 'delwarn' || command === 'quitarwarn') {
                        if (!warnDoc || warnDoc.warnCount === 0) {
                            return conn.sendMessage(m.chat, { 
                                text: `*─── [ ✅ INFO ] ───*\n\nEl usuario @${who.split('@')[0]} no tiene advertencias.`, 
                                mentions: [who] 
                            }, { quoted: m });
                        }

                        let arg = text.replace(/@(\d+)/g, '').trim().toLowerCase();

                        if (arg === 'all' || arg === 'todos') {
                            await global.Warns.deleteOne({ _id: warnDoc._id });
                            return conn.sendMessage(m.chat, { 
                                text: `*─── [ ✅ INFO ] ───*\n\n*Se han borrado todas las advertencias de:* @${who.split('@')[0]}`, 
                                mentions: [who] 
                            }, { quoted: m });
                        }

                        let num = parseInt(arg);
                        if (!isNaN(num) && num > 0 && num <= warnDoc.warnCount) {
                            warnDoc.reasons.splice(num - 1, 1);
                            warnDoc.warnCount -= 1;
                        } else {
                            warnDoc.warnCount -= 1;
                            warnDoc.reasons.pop();
                        }

                        if (warnDoc.warnCount <= 0) {
                            await global.Warns.deleteOne({ _id: warnDoc._id });
                        } else {
                            await warnDoc.save();
                        }

                        return conn.sendMessage(m.chat, { 
                            text: `*─── [ ✅ INFO ] ───*\n\n*Advertencia removida.*\n*Estado actual:* ${warnDoc.warnCount}/${limit}`, 
                            mentions: [who] 
                        }, { quoted: m });
                    }

                } catch (e) {
                    console.error("Error en Warn Command:", e);
                    conn.sendMessage(m.chat, { text: '❌ Ocurrió un error interno.' }, { quoted: m });
                }
            }
        }
    }
};
