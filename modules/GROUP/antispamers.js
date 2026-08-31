global.antispamerWhitelist = global.antispamerWhitelist || {};
const pendingDeletions = {};
const PREFIJOS_SPAM = ['1829', '1809', '1849'];

export const antiBotsGroupModule = {
    category: 'GROUP',
    commands: {
        antispamers: {
            name: 'antispamers',
            alias: ['antispambots', 'filterbots'],
            desc: 'Detecta y elimina bots de spam con prefijos +1 (829, 809, 849) automáticamente o de forma manual.',
            run: async (m, { conn, args, isGroup, isAdmin, isBotAdmin }) => {
                try {
                    const esUnGrupo = isGroup || m.isGroup || m.chat.endsWith('@g.us');

                    if (!esUnGrupo) {
                        return m.reply('> Este comando solo se puede usar dentro de grupos.');
                    }

                    if (!isAdmin) return m.reply('> Solo los administradores pueden usar este comando.');
                    if (!isBotAdmin) return m.reply('> Necesito ser administrador del grupo para expulsar miembros.');

                    const chatId = m.chat;
                    global.antispamerWhitelist[chatId] = global.antispamerWhitelist[chatId] || [];

                    const option = args[0] ? args[0].toLowerCase() : null;

                    // --- PASO: AGREGAR O QUITAR DE LA LISTA BLANCA (EXCLUSIONES) ---
                    if (option === 'excluir' || option === 'whitelist' || option === 'permitir') {
                        let targetJid = m.mentionedJid && m.mentionedJid[0] 
                            ? m.mentionedJid[0] 
                            : (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

                        if (!targetJid && m.quoted) {
                            targetJid = m.quoted.sender;
                        }

                        if (!targetJid) {
                            return m.reply('> Etiqueta, responde a un mensaje o escribe el número de la persona a excluir.\n\n*Ejemplo:* `.antispamers excluir @usuario`');
                        }

                        const cleanNum = targetJid.split('@')[0];
                        const index = global.antispamerWhitelist[chatId].indexOf(cleanNum);

                        if (index > -1) {
                            global.antispamerWhitelist[chatId].splice(index, 1);
                            return m.reply(`✅ El número +${cleanNum} ha sido *removido* de la lista de exclusión.`);
                        } else {
                            global.antispamerWhitelist[chatId].push(cleanNum);
                            return m.reply(`🛡️ El número +${cleanNum} ha sido *añadido* a la lista de exclusión y no será expulsado.`);
                        }
                    }

                    // --- PASO: CONFIRMACIÓN Y ELIMINACIÓN MANUAL ---
                    if (option === 'si' || option === 'sí' || option === 'confirmar') {
                        const listToDelete = pendingDeletions[chatId];

                        if (!listToDelete || listToDelete.length === 0) {
                            return m.reply('> No hay ninguna lista pendiente. Ejecuta primero `.antispamers`.');
                        }

                        await m.reply(`⏳ Eliminando *${listToDelete.length}* cuentas detectadas...`);

                        let successCount = 0;
                        for (const jid of listToDelete) {
                            try {
                                await conn.groupParticipantsUpdate(chatId, [jid], 'remove');
                                successCount++;
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (err) {
                                console.error(`Error al eliminar a ${jid}:`, err);
                            }
                        }

                        delete pendingDeletions[chatId];
                        return m.reply(`✅ *Proceso finalizado.* Se expulsaron *${successCount}* de *${listToDelete.length}* cuentas.`);
                    }

                    // --- PASO: ESCANEO MANUAL Y MUESTRA DE LISTA ---
                    const groupMetadata = await conn.groupMetadata(chatId);
                    const participants = groupMetadata.participants;

                    const detected = participants.filter(p => {
                        const num = p.id.split('@')[0];
                        const isAdminUser = p.admin === 'admin' || p.admin === 'superadmin';
                        const isWhitelisted = global.antispamerWhitelist[chatId].includes(num);

                        return !isAdminUser && !isWhitelisted && PREFIJOS_SPAM.some(prefijo => num.startsWith(prefijo));
                    });

                    if (detected.length === 0) {
                        return m.reply('🔍 No se encontraron cuentas sospechosas (las personas excluidas fueron omitidas).');
                    }

                    pendingDeletions[chatId] = detected.map(p => p.id);

                    let text = `🚨 *DETECCIÓN DE CUENTAS DE SPAM* 🚨\n\n`;
                    text += `Se detectaron *${detected.length}* miembros con prefijo +1 (829/809/849):\n\n`;

                    detected.forEach((p, index) => {
                        const num = p.id.split('@')[0];
                        text += `${index + 1}. +${num}\n`;
                    });

                    text += `\n⚠️ *Para confirmar la expulsión, responde:* \`.antispamers si\``;
                    text += `\n🛡️ *Para excluir a alguien:* \`.antispamers excluir @usuario\``;

                    return m.reply(text);

                } catch (e) {
                    console.error(e);
                    m.reply('> Ocurrió un error al ejecutar el escaneo en el grupo.');
                }
            }
        }
    },

    // --- AUTOMATIZACIÓN AL ENTRAR AL GRUPO ---
    onGroupUpdate: async (anu, { conn }) => {
        try {
            if (anu.action === 'add') {
                const chatId = anu.id;
                const whitelist = global.antispamerWhitelist[chatId] || [];

                for (const participant of anu.participants) {
                    const num = participant.split('@')[0];

                    // Si el número está en la lista de exclusión, el bot no lo expulsa
                    if (whitelist.includes(num)) continue;

                    if (PREFIJOS_SPAM.some(prefijo => num.startsWith(prefijo))) {
                        await conn.sendMessage(chatId, {
                            text: `🚨 *ANTI-SPAMMER DETECTADO*\n\n` +
                                  `• *Usuario:* +${num}\n` +
                                  `• *Motivo:* Prefijo bloqueado por spam (+1 829/809/849).\n` +
                                  `• *Acción:* Expulsión automática.`
                        });

                        await conn.groupParticipantsUpdate(chatId, [participant], 'remove').catch(() => null);
                    }
                }
            }
        } catch (e) {
            console.error('Error en detección automática de antispamers:', e);
        }
    }
};
