export const enableCommand = {
    category: 'gruop',
    commands: {
        enable: {
            name: 'enable',
            alias: ['welcome', 'bv', 'autosticker', 'antisub', 'antilink', 'antilink2', 'antistatus', 'modoadmin', 'antitoxic', 'nsfw', 'anticall', 'antibots', 'autoaceptar', 'autoresponder', 'autochat', 'respuestas', 'auto-responder'],
            admin: true,
            group: true,
            run: async function (m, { conn, command, chat, usedPrefix }) {

                const featureMap = {
                    'welcome': 'welcome',
                    'bv': 'welcome',
                    'gacha': 'gacha',
                    'antisub': 'antisub',
                    'antilink': 'antiLink',
                    'antilink2': 'antiLink2',
                    'anticall': 'antiCall',
                    'antibots': 'antiBots',
                    'antitoxic': 'antiToxic',
                    'autoaceptar': 'autoaceptar',
                    'nsfw': 'nsfw',
                    'antistatus': 'antiStatus',
                    'modoadmin': 'modoadmin', 
                    'autosticker': 'autoStickers',
                    'autoresponder': 'autoresponder',
                    'autochat': 'autoresponder',
                    'respuestas': 'autoresponder',
                    'auto-responder': 'autoresponder'
                };

                const type = command.toLowerCase();

                if (type === 'enable' || !featureMap[type]) {
                    let menu = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n`;
                    const options = [
                        { name: 'Bienvenida', key: 'welcome' },
                        { name: 'Anti-Links', key: 'antiLink' },
                        { name: 'Anti-Links2', key: 'antiLink2' },
                        { name: 'Anti-Toxic', key: 'antiToxic' },
                        { name: 'Modo Admin', key: 'modoadmin' }, 
                        { name: 'Auto-Aceptar', key: 'autoaceptar' }, 
                        { name: 'anti-Bots', key: 'antiBots' }, 
                        { name: 'Nsfw', key: 'nsfw' }, 
                        { name: 'Auto-Stickers', key: 'autoStickers' },
                        { name: 'Auto-Responder', key: 'autoresponder' }
                    ];

                    options.forEach(opt => {
                        const status = chat[opt.key] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                        menu += `❖ *${opt.name}:* ${status}\n`;
                    });
                    return m.reply(menu.trim());
                }

                const dbKey = featureMap[type];
                const newValue = !chat[dbKey];

                await global.Chat.findOneAndUpdate(
                    { id: m.chat },
                    { $set: { [dbKey]: newValue } },
                    { new: true }
                );

                chat[dbKey] = newValue;
                let statusText = newValue ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                return m.reply(`> ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText}.`);
            }
        }
    }
};
