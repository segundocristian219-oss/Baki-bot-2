global.antispamerWhitelist = global.antispamerWhitelist || {};
global.antientradaStatus = global.antientradaStatus || {};

const PREFIJOS_SPAM = ['1829', '1809', '1849'];

export const antiRaidEntryModule = {
    category: 'GROUP',
    commands: {
        antientrada: {
            name: 'antientrada',
            alias: ['antispamentrada', 'filterentradas'],
            desc: 'Expulsa automáticamente a los números con prefijo de spam únicamente cuando intentan ingresar al grupo.',
            run: async (m, { args, isGroup, isAdmin }) => {
                const esUnGrupo = isGroup || m.isGroup || m.chat.endsWith('@g.us');
                if (!esUnGrupo) {
                    return m.reply('> Este comando solo se puede usar dentro de grupos.');
                }
                if (!isAdmin) {
                    return m.reply('> Solo los administradores pueden gestionar el filtro de entradas.');
                }

                const chatId = m.chat;
                const option = args[0] ? args[0].toLowerCase() : null;

                if (option === 'off' || option === 'desactivar') {
                    global.antientradaStatus[chatId] = false;
                    return m.reply('🛡️ *Filtro de entradas desactivado.* Se permitirá el ingreso de cualquier prefijo.');
                }

                if (option === 'on' || option === 'activar') {
                    global.antientradaStatus[chatId] = true;
                    return m.reply('🛡️ *Filtro de entradas ACTIVADO.* Se expulsará automáticamente a quien intente entrar con prefijo (+1 809/829/849).');
                }

                const estadoActual = global.antientradaStatus[chatId] !== false ? 'Activado ✅' : 'Desactivado ❌';
                return m.reply(
                    `🛡️ *PROTECCIÓN DE ENTRADA EN TIEMPO REAL*\n\n` +
                    `• *Estado actual:* ${estadoActual}\n` +
                    `• *Función:* Expulsa inmediatamente a cuentas con prefijo (+1 809/829/849) únicamente cuando se unen al grupo.\n\n` +
                    `👉 \`.antientrada on\` para activar\n` +
                    `👉 \`.antientrada off\` para desactivar`
                );
            }
        }
    },

    onGroupUpdate: async (anu, { conn }) => {
        try {
            const action = anu.action || (anu.participantsUpdate && anu.participantsUpdate.action);
            const chatId = anu.id || anu.jid;
            const participants = anu.participants || (anu.participantsUpdate && anu.participantsUpdate.participants);

            if (action === 'add' && Array.isArray(participants)) {
                if (global.antientradaStatus[chatId] === false) return;

                const whitelist = global.antispamerWhitelist[chatId] || [];

                for (const participant of participants) {
                    const jid = typeof participant === 'string' ? participant : participant.id;
                    if (!jid) continue;

                    const num = jid.split('@')[0];

                    if (whitelist.includes(num)) continue;

                    if (PREFIJOS_SPAM.some(prefijo => num.startsWith(prefijo))) {
                        await conn.sendMessage(chatId, {
                            text: `🚫 *ACCESO DENEGADO*\n\n• Usuario: +${num}\n• Motivo: Bloqueo preventivo por prefijo de spam (+1 809/829/849).`
                        }).catch(() => null);

                        await conn.groupParticipantsUpdate(chatId, [jid], 'remove').catch(() => null);
                    }
                }
            }
        } catch (e) {
            console.error('Error en el filtro de entradas:', e);
        }
    }
};
