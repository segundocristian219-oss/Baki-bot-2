import cp, { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec).bind(cp);

export const developerModule = {
    category: 'owner',
    commands: {
        shell: {
            name: 'shell',
            alias: ['$'],
            libre: true,
            run: async (m, { conn, isROwner, text }) => {
                if (!isROwner) return;
                if (global.conn.user.id !== conn.user.id) return;
                if (!text?.trim()) return;

                await m.react('🕓');

                let o;
                try {
                    o = await exec(text.trim());
                } catch (e) {
                    o = e;
                } finally {
                    const stdout = o?.stdout;
                    const stderr = o?.stderr;
                    if (stdout && stdout.trim()) await m.reply(stdout.trim());
                    if (stderr && stderr.trim()) await m.reply(stderr.trim());
                    await m.react('✅');
                }
            }
        }
    }
};
