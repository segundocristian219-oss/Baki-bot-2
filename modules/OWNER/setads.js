import { closeLMDB, getLMDBDetails } from '../../core/auth_lmdb.js';
import { purgeInactiveSubBots } from '../../core/s/serbot-bridge.js';

export const administrationModule = {
    category: 'owner',
    commands: {
        restart: {
            name: 'restart',
            alias: ['reiniciar', 'reboot'],
            run: async (m, { conn, isROwner }) => {
                if (!isROwner) return;

                try {
                    global.isRestarting = true;
                    await m.reply(`*── 「 REINICIO DEL SISTEMA 」 ──*\n\n▢ *ESTADO:* Reiniciando servidor...\n▢ *TIEMPO:* ~2 segundos\n\n_Espere un momento por favor._`);

                    await new Promise(resolve => setTimeout(resolve, 1500));

                    console.log('┃ [RESTART] Cerrando sockets de Sub-Bots de forma limpia...');

                    if (global.conns && global.conns instanceof Map) {
                        for (const [id, socket] of global.conns.entries()) {
                            if (id === 'main') continue;
                            try {
                                if (socket.ws) socket.ws.close();
                                if (socket.end) socket.end();
                            } catch (_) {}
                        }
                    }

                    try {
                        if (conn?.ws) conn.ws.close();
                        if (conn?.end) conn.end();
                    } catch (_) {}

                    console.log('┃ [RESTART] Cerrando base de datos LMDB y guardando en disco...');
                    await closeLMDB();

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    console.log('┃ [RESTART] Proceso finalizado correctamente. Reiniciando...');
                    process.exit(1);

                } catch (error) {
                    global.isRestarting = false;
                    console.error(error);
                    conn.reply(m.chat, `❌ *ERROR CRÍTICO DURANTE EL REINICIO*\n\n*LOG:* ${error.message}`, m);
                }
            }
        },
        purgelmdb: {
            name: 'purgelmdb',
            alias: ['purgar', 'clearsubbots', 'purgarsubbots'],
            run: async (m, { conn, isROwner }) => {
                if (!isROwner) return;

                try {
                    await m.reply('🧹 *Iniciando purga manual de Sub-Bots inactivos en LMDB...*');
                    
                    const purgedList = purgeInactiveSubBots();

                    if (purgedList.length === 0) {
                        return m.reply('✅ *No se encontraron sesiones inactivas.* Todos los Sub-Bots registrados en la base de datos están conectados o reconectando correctamente.');
                    }

                    let text = `🗑️ *PURGA MANUAL COMPLETADA*\n\n`;
                    text += `▢ *Bases de datos eliminadas:* ${purgedList.length}\n\n`;
                    text += `*Lista de IDs purgados:*\n`;
                    purgedList.forEach((id, index) => {
                        text += `${index + 1}. +${id}\n`;
                    });

                    await m.reply(text);

                } catch (error) {
                    console.error(error);
                    m.reply(`❌ *Error al ejecutar la purga manual:* ${error.message}`);
                }
            }
        },
        listlmdb: {
            name: 'listlmdb',
            alias: ['verlmdb', 'subbotsdb', 'dbsubbots'],
            run: async (m, { conn, isROwner }) => {
                if (!isROwner) return;

                try {
                    const records = getLMDBDetails();

                    if (records.length === 0) {
                        return m.reply('📂 *La base de datos LMDB está completamente vacía.* No hay Sub-Bots guardados.');
                    }

                    let text = `📂 *REGISTROS GUARDADOS EN LMDB*\n\n`;
                    text += `▢ *Total de sub-bases de datos:* ${records.length}\n\n`;

                    records.forEach((rec, index) => {
                        const isConnected = global.conns.get(rec.id)?._isOpen;
                        const status = isConnected ? '🟢 Online' : '🔴 Offline';

                        text += `*${index + 1}. Sub-Bot:* +${rec.id}\n`;
                        text += `   ├ *Estado Socket:* ${status}\n`;
                        text += `   ├ *Registrado:* ${rec.registered ? 'Sí' : 'No'}\n`;
                        text += `   └ *Claves en RAM/Disco:* ${rec.keysCount} registros\n\n`;
                    });

                    await m.reply(text.trim());

                } catch (error) {
                    console.error(error);
                    m.reply(`❌ *Error al leer registros de LMDB:* ${error.message}`);
                }
            }
        }
    }
};
