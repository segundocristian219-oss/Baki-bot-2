global.notifyAdminStatus = global.notifyAdminStatus || {};

export const notifyAdminModule = {
    category: 'GROUP',
    commands: {
        detectadmin: {
            name: 'detectadmin',
            alias: ['notifyadmin', 'avisaradmin'],
            desc: 'Activa o desactiva las notificaciones cuando alguien da o quita administrador.',
            run: async (m, { args, isGroup, isAdmin, isOwner }) => {
                const esUnGrupo = isGroup || m.isGroup || m.chat.endsWith('@g.us');
                if (!esUnGrupo) {
                    return m.reply('> Este comando solo se puede usar dentro de grupos.');
                }

                if (!isAdmin && !isOwner) {
                    return m.reply('> Solo los administradores del grupo o los creadores del bot pueden usar este comando.');
                }

                const chatId = m.chat;
                const option = args[0] ? args[0].toLowerCase() : null;

                if (option === 'off' || option === 'desactivar') {
                    global.notifyAdminStatus[chatId] = false;
                    return m.reply('🔔 *Detección de Administradores DESACTIVADA.*');
                }

                if (option === 'on' || option === 'activar') {
                    global.notifyAdminStatus[chatId] = true;
                    return m.reply('🔔 *Detección de Administradores ACTIVADA.* Se notificará cuando se dé o quite rango.');
                }

                const estadoActual = global.notifyAdminStatus[chatId] ? 'Activado ✅' : 'Desactivado ❌';
                return m.reply(
                    `🔔 *AVISO DE CAMBIOS DE ADMINISTRADOR*\n\n` +
                    `• *Estado actual:* ${estadoActual}\n\n` +
                    `👉 \`.detectadmin on\` para activar\n` +
                    `👉 \`.detectadmin off\` para desactivar`
                );
            }
        }
    },

    before: async (m, { conn, isGroup }) => {
        if (!isGroup || !m.chat) return;
        if (!global.notifyAdminStatus[m.chat]) return;

        const stubType = m.messageStubType;
        if (!stubType) return;

        const isPromote = stubType === 29 || stubType === 'PROMOTE' || stubType === 71;
        const isDemote = stubType === 30 || stubType === 'DEMOTE' || stubType === 72;

        if (isPromote || isDemote) {
            const param = m.messageStubParameters || [];
            const targetJid = param[0];
            const actorJid = m.sender || m.key?.participant || m.participant;

            const targetTag = targetJid ? `@${targetJid.split('@')[0]}` : 'un usuario';
            const actorTag = actorJid ? `@${actorJid.split('@')[0]}` : 'Un administrador';

            if (isPromote) {
                await conn.sendMessage(m.chat, {
                    text: `👑 *NUEVO ADMINISTRADOR*\n\n• *Promovido:* ${targetTag}\n• *Por:* ${actorTag}`,
                    mentions: [targetJid, actorJid].filter(Boolean)
                }).catch(() => null);
            }

            if (isDemote) {
                await conn.sendMessage(m.chat, {
                    text: `📉 *ADMINISTRADOR DEGRADADO*\n\n• *Usuario:* ${targetTag}\n• *Por:* ${actorTag}`,
                    mentions: [targetJid, actorJid].filter(Boolean)
                }).catch(() => null);
            }
        }
    }
};
