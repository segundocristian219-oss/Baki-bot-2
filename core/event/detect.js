import { jidNormalizedUser } from '@whiskeysockets/baileys';

export async function observeEvents(conn) {
    if (!conn) return;

    conn.ev.on('group-participants.update', async (m) => {
        try {
            const chatJid = m.id || m.chat;
            if (!chatJid?.endsWith('@g.us')) return;

            if (!global.Chat || typeof global.Chat.findOne !== 'function') return;
            const chat = await global.Chat.findOne({ id: chatJid });

            if (!chat || !chat.welcome || chat.isBanned) return;

            const botJid = jidNormalizedUser(conn.user?.id || '');
            const isMainBot = botJid === jidNormalizedUser(global.conn?.user?.id || '');

            if (chat.antisub && !isMainBot) return;

            if (m.action === 'add') {
                let groupMetadata = global.groupCache?.get(chatJid);
                if (!groupMetadata) {
                    groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
                    if (groupMetadata && global.groupCache) {
                        global.groupCache.set(chatJid, groupMetadata);
                    }
                }

                const groupName = groupMetadata.subject || 'Sistema';
                const memberCount = groupMetadata.participants?.length || 0;
                const groupDesc = groupMetadata.desc || 'Sin descripción';
                const defaultImage = (typeof global.img === 'function' ? global.img(conn) : global.img);

                await Promise.all(
                    m.participants.map(async (part) => {
                        const userJid = part.id || part.phoneNumber;
                        if (!userJid) return;

                        const whoTag = `@${userJid.split('@')[0]}`;
                        let txt = '';

                        if (chat.customWelcome) {
                            txt = chat.customWelcome
                                .replace(/@us/g, whoTag)
                                .replace(/@g/g, groupName)
                                .replace(/@t/g, memberCount)
                                .replace(/@d/g, groupDesc)
                                .replace(/@n/g, groupName.toUpperCase());
                        } else {
                            txt = `╭──────────────┄\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ɴᴏᴅᴇ: ${groupName}\n│〉 ꜱᴛᴀᴛᴜꜱ: ᴏɴʟɪɴᴇ\n┝──────────────┄\n┝➠  ᴅᴀᴛᴀ\n│ ɴᴏᴅᴏꜱ: [ ${memberCount} ]\n╰─────────────┄\n\n`;
                        }

                        const botonesWelcome = [
                            { text: 'HOLA SIGUE NUESTRO CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }, { text: 'VER MENÚ', id: '.menu' }
                        ];

                        const opcionesWelcome = {
                            title: groupName,
                            footer: 'Desarrollador • Deylin Eliac ',
                            image: typeof defaultImage === 'string' && defaultImage.startsWith('http') ? { url: defaultImage } : (Buffer.isBuffer(defaultImage) ? defaultImage : { url: defaultImage }),
                            mentions: [userJid]
                        };

                        await conn.sendButtonMessage(chatJid, txt, botonesWelcome, opcionesWelcome).catch(() => null);
                    })
                );
            }
        } catch (e) {
            console.error(e);
        }
    });
}
