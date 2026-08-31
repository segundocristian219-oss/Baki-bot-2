import fs from 'fs';
import path from 'path';

export const menuGameCommand = {
    category: 'game',
    commands: {
        menugame: {
            name: 'menugame',
            alias: ['game', 'juegos', 'juegosmenu'],
            run: async (m, { conn, usedPrefix }) => {
                const gameFolder = path.join(process.cwd(), 'modules/GAME');

                if (!fs.existsSync(gameFolder)) {
                    return m.reply('❌ La carpeta de juegos (plugins/game) no existe en este proyecto.');
                }

                try {
                    const files = fs.readdirSync(gameFolder).filter(file => file.endsWith('.js'));

                    if (files.length === 0) {
                        return m.reply('🎰 No se encontraron archivos de comandos en la carpeta de juegos.');
                    }

                    let txt = `🎮 ─── *${typeof name === 'function' ? name(conn) : '⧫ Kɪʀɪᴛᴏ-Bᴏᴛ MD ⧫'} GAME MENU* ─── 🎮\n\n`;
                    txt += `> Usa el prefijo *${usedPrefix}* antes de cada comando.\n\n`;

                    for (const file of files) {
                        if (file === 'menu.js') continue;

                        const filePath = path.join(gameFolder, file);
                        const fileUrl = `file://${filePath}?update=${Date.now()}`;

                        let importedModule;
                        try { 
                            importedModule = await import(fileUrl); 
                        } catch { 
                            continue; 
                        }

                        
                        const moduleKey = Object.keys(importedModule).find(key => 
                            key.endsWith('Command') || 
                            key.endsWith('Module') || 
                            key === 'default' || 
                            (importedModule[key] && typeof importedModule[key] === 'object' && importedModule[key].commands)
                        );
                        
                        const moduleData = importedModule[moduleKey] || importedModule.default;

                        if (!moduleData || !moduleData.commands) continue;

                        for (const cmdKey in moduleData.commands) {
                            const plugin = moduleData.commands[cmdKey];
                            if (!plugin || typeof plugin !== 'object') continue;

                            const categoryName = file.replace('.js', '').toUpperCase();

                            txt += `╭━━〔 *${categoryName}* 〕━━\n`;
                            txt += `┃ ❖ *Comando:* ${usedPrefix}${plugin.name || cmdKey}\n`;

                            if (plugin.alias && Array.isArray(plugin.alias) && plugin.alias.length > 0) {
                                txt += `┃ ❖ *Alias:* ${plugin.alias.map(a => usedPrefix + a).join(', ')}\n`;
                            } else if (plugin.alias && typeof plugin.alias === 'string') {
                                txt += `┃ ❖ *Alias:* ${usedPrefix}${plugin.alias}\n`;
                            }

                            if (plugin.description) {
                                txt += `┃ ❖ *Info:* ${plugin.description}\n`;
                            } else {
                                txt += `┃ ❖ *Info:* Sin descripción disponible\n`;
                            }

                            txt += `╰━━━━━━━━━━━━━━━━━━━━\n\n`;
                        }
                    }

                    const thumb = typeof img === 'function' ? img(conn) : 'https://dix.lat';

                    await conn.sendMessage(m.chat, {
                        image: { url: thumb },
                        caption: txt.trim()
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    m.reply('❌ Ocurrió un error al intentar estructurar el menú de juegos.');
                }
            }
        }
    }
};
