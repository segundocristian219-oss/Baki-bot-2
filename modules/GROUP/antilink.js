import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const antiLinkCommand = {
    commands: {
        antilink_pro: {
            name: 'antilink_pro',
            alias: [],
            async before(m, { conn, isOwner, chat }) {
                if (!m.isGroup || !chat?.antiLink || isOwner || m.fromMe) return false;

                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
                if (!groupMetadata) return false;

                const participant = groupMetadata.participants.find(p => p.id === m.sender);
                const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

                if (isAdmin) return false;

                const fullText = [
                    m.text || '',
                    m.msg?.text || '',
                    m.msg?.matchedText || '',
                    m.msg?.canonicalUrl || '',
                    m.msg?.caption || ''
                ].join(' ');

                const linkRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;
                const channelRegex = /whatsapp\.com\/channel\/([0-9A-Za-z]{20,30})/i;

                const isGroupLink = linkRegex.exec(fullText);
                const isChannelLink = channelRegex.exec(fullText);

                const isForwardedChannel = !!(
                    m.msg?.contextInfo?.forwardedNewsletterMessageInfo ||
                    m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                    m.message?.imageMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                    m.message?.videoMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                    m.message?.audioMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                    m.message?.documentMessage?.contextInfo?.forwardedNewsletterMessageInfo
                );

                const hasLink = isGroupLink || isChannelLink || isForwardedChannel;
                if (!hasLink) return false;

                if (isGroupLink) {
                    const myCode = await conn.groupInviteCode(m.chat).catch(() => null);
                    if (myCode && isGroupLink[1] === myCode) return false;
                }

                const botId = jidNormalizedUser(conn.user.id);
                const botParticipant = groupMetadata.participants.find(p => p.id === botId);
                const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                if (isBotAdmin) {
                    await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                    await new Promise(r => setTimeout(r, 500));
                    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => null);

                    const type = (isChannelLink || isForwardedChannel) ? 'canales' : 'otros grupos';
                    const txt = `> ✰ Se ha eliminado a @${m.sender.split('@')[0]} del grupo por \`AntiLink\`, no permitimos enlaces de *${type}*.`;
                    
                    const botones = [
                        { text: 'HOLA SIGUE NUESTRO CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }
                    ];

                    const opciones = {
                        title: 'AntiLink',
                        footer: 'kirito-Bot-MD',
                        mentions: [m.sender]
                    };

                    await conn.sendButtonMessage(m.chat, txt, botones, opciones).catch(() => null);
                } else {
                    await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                }

                return true;
            }
        }
    }
};
