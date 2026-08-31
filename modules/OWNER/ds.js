import { existsSync, promises as fs } from 'fs';
import path from 'path';

export const cleanSessionModule = {
    category: 'owner',
    commands: {
        ds: {
            name: 'ds',
            alias: ['cleansession', 'limpiar'],
            run: async (m, { conn, isROwner }) => {
                if (!isROwner) return;

                const paths = [
                    path.resolve(`./${global.authFolder || 'sessions'}/`),
                    path.resolve('./tmp/'),
                    path.resolve('./jadibts/')
                ];
                let filesDeleted = 0;

                try {
                    await m.react('🧹');

                    for (const rootPath of paths) {
                        if (!existsSync(rootPath)) continue;

                        if (rootPath.endsWith('jadibts')) {
                            const subBotFolders = await fs.readdir(rootPath);
                            for (const folder of subBotFolders) {
                                const subBotPath = path.join(rootPath, folder);
                                
                                if (!global.conns?.has(folder)) {
                                    await fs.rm(subBotPath, { recursive: true, force: true }).catch(() => null);
                                    filesDeleted++;
                                } else {
                                    const subFiles = await fs.readdir(subBotPath);
                                    for (const file of subFiles) {
                                        if (file !== 'creds.json') {
                                            await fs.unlink(path.join(subBotPath, file)).catch(() => null);
                                            filesDeleted++;
                                        }
                                    }
                                }
                            }
                        } else {
                            const files = await fs.readdir(rootPath);
                            for (const file of files) {
                                if (file !== 'creds.json') {
                                    await fs.unlink(path.join(rootPath, file)).catch(() => null);
                                    filesDeleted++;
                                }
                            }
                        }
                    }

                    if (filesDeleted === 0) {
                        await m.reply('> *Sistema optimizado.*');
                    } else {
                        await m.reply(`> ♛  *PURGA TOTAL FINALIZADA*\n\n✦  *Archivos:* ${filesDeleted}\n✧  *Alcance:* Principal + SubBots\n\n*DEYLIN ELÍAC - SYSTEM*`);
                    }
                    await m.react('✅');
                } catch {
                    await m.react('❌');
                }
            }
        }
    }
};
