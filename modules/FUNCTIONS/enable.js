export const configCommand = {
    category: 'config',
    commands: {
        enable: {
            name: 'enable',
            alias: ['welcome', 'bv', 'autosticker', 'antisub', 'antilink', 'antilink2', 'modoadmin', 'antitoxic', 'nsfw', 'antibots', 'autoaceptar'],
            admin: true,
            group: true,
            run: async function (m, { conn, command, args, chat }) {
                chat = chat || {};

                const featureMap = {
                    'welcome': 'welcome',
                    'bv': 'welcome',
                    'antisub': 'antisub',
                    'antilink': 'antiLink',
                    'antilink2': 'antiLink2',
                    'antibots': 'antiBots',
                    'antitoxic': 'antiToxic',
                    'autoaceptar': 'autoaceptar',
                    'nsfw': 'nsfw',
                    'modoadmin': 'modoadmin',
                    'autosticker': 'autoStickers',
                };

                const type = command.toLowerCase();
                const isGeneric = type === 'enable' || type === 'disable';
                let target = isGeneric ? (args[0] || '').toLowerCase() : type;

                if (!target || !featureMap[target]) {
                    let menu = `❯❯  Stamm SYSTEM CONFIGURATION\n\n`;
                    const options = [
                        { name: 'Bienvenida', key: 'welcome' },
                        { name: 'Anti-Links', key: 'antiLink' },
                        { name: 'Anti-Links2', key: 'antiLink2' },
                        { name: 'Anti-Toxic', key: 'antiToxic' },
                        { name: 'Modo Admin', key: 'modoadmin' },
                        { name: 'Auto-Aceptar', key: 'autoaceptar' },
                        { name: 'Anti-Bots', key: 'antiBots' },
                        { name: 'Nsfw', key: 'nsfw' },
                        { name: 'Auto-Stickers', key: 'autoStickers' }
                    ];
                    options.forEach(opt => {
                        const status = chat[opt.key] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                        menu += `❖ *${opt.name}:* ${status}\n`;
                    });
                    return m.reply(menu.trim());
                }

                const dbKey = featureMap[target];
                const actionRaw = isGeneric ? (args[1] || '') : (args[0] || '');
                const action = actionRaw.toLowerCase();

                let newValue = !chat[dbKey];
                if (['on', '1', 'true', 'activar'].includes(action)) newValue = true;
                if (['off', '0', 'false', 'desactivar'].includes(action)) newValue = false;

                await global.Chat.findOneAndUpdate(
                    { id: m.chat },
                    { $set: { [dbKey]: newValue } },
                    { new: true, upsert: true }
                );

                chat[dbKey] = newValue;
                const statusText = newValue ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                return m.reply(`> ʟᴀ ғᴜɴᴄɪᴏɴ *${target.toUpperCase()}* sᴇ ʜᴀ ${statusText}.`);
            }
        }
    }
};
