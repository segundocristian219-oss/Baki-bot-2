import fs from 'fs';
import path from 'path';

export const checkSyntaxModule = {
    category: 'owner',
    commands: {
        errores: {
            name: 'errores',
            alias: ['checkall', 'debug'],
            run: async (m, { conn }) => {
                const rootDir = process.cwd();
                let reports = [];
                let filesChecked = 0;

                const validateFile = async (fullPath) => {
                    const relPath = path.relative(rootDir, fullPath);
                    try {
                        const fileUrl = `file://${path.resolve(fullPath)}?update=${Date.now()}`;
                        await import(fileUrl);
                    } catch (err) {
                        reports.push(`📄 *ARCHIVO:* \`${relPath}\`
⚠️ *ERROR:* \`${err.message}\`
📍 *TIPO:* Fallo de Importación/Sintaxis`);
                    }
                };

                const walk = async (dir) => {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        const fullPath = path.join(dir, file);
                        const stat = fs.statSync(fullPath);
                        if (stat.isDirectory()) {
                            if (['node_modules', '.git', 'sessions', 'tmp', '.npm'].includes(file)) continue;
                            await walk(fullPath);
                        } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
                            filesChecked++;
                            await validateFile(fullPath);
                        }
                    }
                };

                try {
                    await m.react('🕒');
                    await walk(rootDir);

                    if (reports.length === 0) {
                        await m.react('✅');
                        return await conn.sendMessage(m.chat, { 
                            text: `✅ *PROYECTO LIMPIO*\n\nSe revisaron *${filesChecked}* archivos en todo el sistema y no se detectaron fallos.` 
                        }, { quoted: m });
                    }

                    let header = `🚨 *REPORTE DE ERRORES (${reports.length})*\n\n`;
                    let chunks = [];
                    let currentChunk = header;

                    for (let report of reports) {
                        if ((currentChunk + report).length > 3500) {
                            chunks.push(currentChunk);
                            currentChunk = '';
                        }
                        currentChunk += report + '\n' + '─'.repeat(15) + '\n';
                    }
                    chunks.push(currentChunk + `\n*Total revisado:* ${filesChecked} archivos.`);

                    for (let text of chunks) {
                        await conn.sendMessage(m.chat, { text }, { quoted: m });
                    }
                    await m.react('⚠️');

                } catch (e) {
                    await m.react('✖️');
                    await m.reply('❌ Error en el escáner: ' + e.message);
                }
            }
        }
    }
};
