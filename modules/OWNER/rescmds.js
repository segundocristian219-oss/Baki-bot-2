import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'local_db.json');

const readDb = () => {
    try {
        if (!fs.existsSync(dbPath)) return {};
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch {
        return {};
    }
};

const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export const resCmdsModule = {
    category: 'owner',
    commands: {
        rescmds: {
            name: 'rescmd',
            alias: ['rescmds', 'restrictcmd', 'unrescmd'],
            rowner: true,
            run: async (m, { conn, args, usedPrefix, command }) => {
                if (!args[0]) return m.reply(`> ❒ *Uso correcto:*\n• Restringir: *${usedPrefix}${command} <comando> <razón>*\n• Liberar: *${usedPrefix}${command} <comando>*`);

                const cmdToRestrict = args[0].toLowerCase().replace(/^[.#/!]/, '');
                const reason = args.slice(1).join(' ').trim();
                const db = readDb();

                if (db[cmdToRestrict]) {
                    if (!reason) {
                        delete db[cmdToRestrict];
                        writeDb(db);
                        return m.reply(`> ❒ El comando *${usedPrefix}${cmdToRestrict}* ha sido liberado.`);
                    } else {
                        db[cmdToRestrict] = { razon: reason };
                        writeDb(db);
                        return m.reply(`> ❒ Razón actualizada para *${usedPrefix}${cmdToRestrict}*: ${reason}`);
                    }
                } else {
                    if (!reason) return m.reply(`> ❒ Para restringir *${usedPrefix}${cmdToRestrict}* debes añadir una razón.`);
                    db[cmdToRestrict] = { razon: reason };
                    writeDb(db);
                    return m.reply(`> ❒ Comando *${usedPrefix}${cmdToRestrict}* restringido.\n*Motivo:* ${reason}`);
                }
            }
        }
    }
};