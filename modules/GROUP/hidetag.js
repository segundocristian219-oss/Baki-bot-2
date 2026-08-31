export const hidetagCommand = {
    category: 'group',
    commands: {
        hidetag: {
            name: 'hidetag',
            alias: ['tag', 'n', 'notificar'],
            admin: true,
            group: true,
            run: async (m, { conn, text }) => {
                try {
                    let metadata = global.groupCache?.get(m.chat);
                    if (!metadata) {
                        metadata = await conn.groupMetadata(m.chat).catch(() => null);
                        if (metadata && global.groupCache) global.groupCache.set(m.chat, metadata);
                    }

                    if (!metadata || !metadata.participants) return await m.react('❌');

                    const users = [];
                    metadata.participants.forEach(u => {
                        if (u.id) users.push(u.id);
                        if (u.phoneNumber) users.push(u.phoneNumber);
                    });

                    const mentions = [...new Set(users)];
                    const q = m.quoted ? m.quoted : m;
                    const mime = (q.msg || q).mimetype || '';
                    const tagText = text || (m.quoted && m.quoted.text) || "Nᴏᴛɪғɪᴄᴀᴄɪóɴ Gᴇɴᴇʀᴀʟ";
                    const botones = [{ text: 'Canal', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }];

                    if (mime) {
                        const media = await q.download();
                        const type = mime.split('/')[0];

                        if (mime.includes('webp')) {
                            await conn.sendMessage(m.chat, { sticker: media, mentions }, { quoted: m });
                        } else {
                            await conn.sendMessage(m.chat, { 
                                [type]: media, 
                                caption: tagText, 
                                mentions 
                            }, { quoted: m });
                        }
                    } else {
                        if (tagText.length <= 50) {
                            await conn.sendMessage(m.chat, {
                                text: "@" + m.chat,
                                previewType: "NONE",
                                contextInfo: {
                                    mentionedJid: mentions,
                                    groupMentions: [{
                                        groupJid: m.chat,
                                        groupSubject: text || "Notificación"
                                    }]
                                },
                                inviteLinkGroupTypeV2: "DEFAULT"
                            }, { quoted: null });
                        } else {
                            const opciones = {
                                footer: 'BAKI BOT',
                                mentions
                            };
                            await conn.sendButtonMessage(m.chat, tagText, botones, opciones).catch(() => null);
                        }
                    }

                    await m.react('✅');
                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                }
            }
        }
    }
};
