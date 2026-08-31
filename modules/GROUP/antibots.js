import { jidNormalizedUser } from '@whiskeysockets/baileys';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const antiBotsCommand = {
    category: 'gruop',
    commands: {
        antibots_pro: {
            name: 'antibots_pro',
            alias: [],
            async before(m, { conn, isOwner, chat }) {
                if (!m.isGroup || !chat?.antiBots || isOwner || m.fromMe) return false;

                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
                if (!groupMetadata) return false;

                const participant = groupMetadata.participants.find(p => p.id === m.sender);
                const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

                if (isAdmin) return false;

                const msg = m.message?.interactiveMessage || m.msg;
                const hasButtons = !!(
                    m.message?.buttonsMessage || 
                    m.message?.interactiveMessage || 
                    m.message?.templateMessage || 
                    msg?.nativeFlowMessage ||
                    m.mtype === 'interactiveMessage'
                );

                if (hasButtons) {
                    const botId = jidNormalizedUser(conn.user.id);
                    const botParticipant = groupMetadata.participants.find(p => p.id === botId);
                    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                    if (isBotAdmin) {
                        await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                        await delay(500);
                        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => null);

                        await conn.sendMessage(m.chat, { 
                            text: `> ✰ Se ha eliminado a @${m.sender.split('@')[0]} del grupo por \`AntiBots\`, no se permiten bots externos en este grupo.`,
                            mentions: [m.sender]
                        }).catch(() => null);
                    } else {
                        await conn.sendMessage(m.chat, { text: "⚠️ *AntiBots:* Detecté un mensaje con botones pero no tengo permisos de administrador para eliminar al usuario." }).catch(() => null);
                    }
                    return true;
                }
                return false;
            }
        }
    }
};

export default antiBotsCommand;
