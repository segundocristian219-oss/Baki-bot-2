export const botControl = {
    category: 'main',
    commands: {
        bot: {
            name: 'bot',
            alias: ['enable', 'onchat'],
            admin: false,
            isOwner: false,
            isPrem: true,
            self: true,
            run: async (m, { conn, args, usedPrefix, command, isROwner, isAdmin }) => {
                try {
                    if (!m.isGroup) return m.reply("『 ℹ️ 』 Función limitada a terminales de grupo.");
                    if (!isAdmin && !isROwner) return global.dfail('admin', m, conn);
                    if (!global.Chat) return;

                    let chat = await global.Chat.findOne({ id: m.chat });
                    if (!chat) chat = await global.Chat.create({ id: m.chat, isBanned: false });

                    const action = args[0]?.toLowerCase();

                    if (action === 'off') {
                        if (chat.isBanned) return m.reply("『 ⚠️ 』 Sistema offline.");
                        await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: true } });
                        await m.react("✖️");
                        return conn.sendMessage(m.chat, { 
                            text: `『 ⫸ SISTEMA SUSPENDIDO 』\n\n◆ Terminal desactivado.\n◆ ID: @${m.sender.split('@')[0]}\n\n⌬ Reactivación: ${usedPrefix + command} on`,
                            mentions: [m.sender],
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    if (action === 'on') {
                        if (!chat.isBanned) return m.reply("『 ⚠️ 』 Sistema online.");
                        await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: false } });
                        await m.react("✔️");
                        return conn.sendMessage(m.chat, { 
                            text: `『 ⫸ SISTEMA RESTAURADO 』\n\n◆ Conexión establecida.\n◆ Estado: Operativo.`,
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    const status = chat.isBanned ? '✖ SUSPENDIDO' : '⌬ OPERATIVO';
                    return conn.sendMessage(m.chat, { 
                        text: `『 ⚙︎ CONTROL DE ENLACE 』\n\n◈ ESTADO: ${status}\n◈ MÉTODO: ${usedPrefix + command} [on/off]`,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
};
