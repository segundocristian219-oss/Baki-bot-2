const moduleData = {
    functions: {
        category: 'Functions',
        commands: {
            limpiar: {
                name: 'limpiar',
                alias: ['clear', 'del', 'delete', 'purge'],
                desc: 'Elimina una cantidad específica de mensajes recientes en el chat (Admins & Owners).',
                run: async (m, { args, usedPrefix, command, conn }) => {
                    if (!m.isGroup) {
                        return conn.sendMessage(m.chat, { text: '❌ This command can only be used in groups.' }, { quoted: m });
                    }

                    try {
                        const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
                        if (!groupMetadata) {
                            return conn.sendMessage(m.chat, { text: '❌ Failed to retrieve group metadata.' }, { quoted: m });
                        }

                        const participants = groupMetadata.participants || [];
                        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                        
                        const userAdmin = participants.find(p => p.id === m.sender)?.admin;
                        const botAdmin = participants.find(p => p.id === botJid)?.admin;

                        const isOwner = m.isOwner || 
                                        (global.owner && global.owner.some(owner => owner[0] + '@s.whatsapp.net' === m.sender)) ||
                                        (global.numberOwner && global.numberOwner.includes(m.sender.split('@')[0]));

                        if (!userAdmin && !isOwner) {
                            return conn.sendMessage(m.chat, { text: '❌ Access Denied: This command is restricted to Group Admins or the Bot Owner.' }, { quoted: m });
                        }

                        if (!botAdmin) {
                            return conn.sendMessage(m.chat, { text: '❌ I need to be an administrator to delete messages from other users.' }, { quoted: m });
                        }

                        let cantidad = parseInt(args[0]);
                        if (isNaN(cantidad) || cantidad < 1 || cantidad > 100) {
                            return conn.sendMessage(m.chat, { 
                                text: `❌ Please specify a valid number of messages to clear (1-100).\n\n*Example:* ${usedPrefix}${command} 20` 
                            }, { quoted: m });
                        }

                        const store = global.store; 
                        if (!store || !store.messages[m.chat]) {
                            return conn.sendMessage(m.chat, { text: '❌ No recent message history found in memory to purge.' }, { quoted: m });
                        }

                        const mensajesDelChat = store.messages[m.chat].array;
                        const mensajesABorrar = mensajesDelChat.slice(-(cantidad + 1));

                        for (const msg of mensajesABorrar) {
                            if (!msg.key) continue;
                            
                            await conn.sendMessage(m.chat, {
                                delete: {
                                    remoteJid: m.chat,
                                    fromMe: msg.key.fromMe,
                                    id: msg.key.id,
                                    participant: msg.key.participant || msg.key.remoteJid
                                }
                            }).catch(() => null);
                        }

                        const { key } = await conn.sendMessage(m.chat, { text: `🧹 *Chat Cleared:* ${cantidad} messages have been successfully removed.` });
                        
                        setTimeout(async () => {
                            await conn.sendMessage(m.chat, { delete: key }).catch(() => null);
                        }, 4000);

                    } catch (error) {
                        console.error(error);
                        await conn.sendMessage(m.chat, { text: '❌ An internal error occurred while trying to clean the chat.' }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
