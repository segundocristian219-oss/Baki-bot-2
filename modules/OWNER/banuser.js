export const banUserModule = {
    category: 'owner',
    commands: {
        banuser: {
            name: 'ban/unban',
            alias: ['banuser', 'unbanuser', 'unban', 'desbanear', 'listban', 'banlist'],
            run: async (m, { conn, text, isROwner, command }) => {
                try {
                    if (!isROwner) return;

                    if (['listban', 'banlist'].includes(command)) {
                        if (!global.User) throw new Error("DB_NOT_FOUND");

                        const bannedUsers = await global.User.find({ banned: true });

                        if (bannedUsers.length === 0) {
                            return m.reply('-- LISTA DE USUARIOS BLOQUEADOS --\n\nNo hay usuarios restringidos en el sistema.');
                        }

                        let list = '-- LISTA DE USUARIOS BLOQUEADOS --\n\n';
                        bannedUsers.forEach((u, i) => {
                            list += `${i + 1}. @${u.id.split('@')[0]}\nRAZON: ${u.banReason || 'Sin motivo'}\n\n`;
                        });

                        return conn.reply(m.chat, list, m, { mentions: bannedUsers.map(u => u.id) });
                    }

                    const isUnban = /unban|desbanear/i.test(command);
                    let target;
                    let reason = 'Infraccion de las reglas del sistema';

                    if (m.quoted) {
                        target = m.quoted.sender;
                        reason = text || reason;
                    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                        target = m.mentionedJid[0];
                        reason = text.replace(/@(\d+)/g, '').trim() || reason;
                    } else if (text) {
                        let input = text.split(' ');
                        let num = input[0].replace(/[^0-9]/g, '');
                        if (num.length >= 8) {
                            target = num + '@s.whatsapp.net';
                            reason = input.slice(1).join(' ').trim() || reason;
                        }
                    }

                    if (!target) {
                        return m.reply(`USO CORRECTO: ${command} [@mencion / responder / numero] [razon]\n\nPara ver la lista usa: .listban`);
                    }

                    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                    if (!isUnban && (target === botId || target === conn.user.id)) {
                        return;
                    }

                    if (!global.User) throw new Error("DB_NOT_FOUND");

                    await global.User.findOneAndUpdate(
                        { id: target },
                        { $set: { banned: !isUnban, banReason: isUnban ? '' : reason } },
                        { upsert: true }
                    );

                    const status = isUnban ? 'USUARIO DESBLOQUEADO' : 'USUARIO BLOQUEADO';
                    await conn.reply(m.chat, `${status}\n\nID: @${target.split('@')[0]}${!isUnban ? '\nRAZON: ' + reason : ''}`, m, { mentions: [target] });

                } catch (e) {
                    await conn.reply(m.chat, `ERROR: ${e.message}`, m);
                }
            }
        }
    }
};
