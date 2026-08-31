import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runCmd = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout);
    });
});

export const updateCommand = {
    commands: {
        update: {
            name: 'update',
            alias: ['actualizar', 'up', 'sync'],
            category: 'owner',
            rowner: true,
            run: async (m, { conn, args }) => {
                try {
                    await m.react("🔄");
                    const output = await runCmd(`git pull ${args[0] || ''}`);

                    if (/Already up[ -]to[ -]date/i.test(output)) {
                        await m.react("✅");
                        return conn.sendMessage(m.chat, { text: '┃ SYSTEM ┃ El repositorio local ya se encuentra en su versión más reciente.' }, { quoted: m });
                    }

                    const updateMsg = `┃ INFRAESTRUCTURA ┃ ACTUALIZACIÓN REALIZADA\n\n\`\`\`${output.trim()}\`\`\`\n\nRe-indexando módulos del sistema...`;
                    await conn.sendMessage(m.chat, { text: updateMsg }, { quoted: m });

                    if (typeof global.reloadModules === 'function') {
                        await global.reloadModules(true);
                    }
                    if (typeof global.reload === 'function') {
                        await global.reload(true);
                    }

                    await m.react("⚙️");
                    return m.reply("┃ CORE ┃ Despliegue completado. Los nuevos módulos están en ejecución.");

                } catch (error) {
                    let status = '';
                    try { status = await runCmd('git status --porcelain'); } catch { status = 'Fallo al verificar el estado del repositorio.'; }

                    const conflictMsg = status.trim() 
                        ? `┃ REPO CONFLICT ┃\n\`\`\`${status.trim()}\`\`\`` 
                        : error.toString();

                    await conn.sendMessage(m.chat, { text: `┃ ERROR EXCEPTION ┃\n\n${conflictMsg}` }, { quoted: m });
                    await m.react("❌");
                }
            }
        }
    }
};
