import fs from 'fs';
import path from 'path';

export const helpDevModule = {
    category: 'owner',
    commands: {
        helpdev: {
            name: 'helpdev',
            alias: ['owner'],
            rowner: true,
            run: async (m, { conn, usedPrefix }) => {
                
                const ownerFolder = path.join(process.cwd(), 'modules/OWNER');

                if (!fs.existsSync(ownerFolder)) {
                    return m.reply('❌ La carpeta no existe en este proyecto.');
                }

                try {
                    const files = fs.readdirSync(ownerFolder).filter(file => file.endsWith('.js'));

                    if (files.length === 0) {
                        return m.reply('❌ No se encontraron archivos de comandos.');
                    }

                    let txt = `> Usa el prefijo *${usedPrefix}* antes de cada comando.\n\n`;

                    for (const file of files) {
                        if (file === 'menu.js' || file === 'help.js') continue;

                        const filePath = path.join(ownerFolder, file);
                        const fileUrl = `file://${filePath}?update=${Date.now()}`;

                        let importedModule;
                        try {
                            importedModule = await import(fileUrl);
                        } catch {
                            continue;
                        }

                        
                        const moduleKey = Object.keys(importedModule).find(key => key.endsWith('Module') || key === 'default');
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
                    m.reply('❌ Ocurrió un error al intentar estructurar el menú.');
                }
            }
        }
    }
};
