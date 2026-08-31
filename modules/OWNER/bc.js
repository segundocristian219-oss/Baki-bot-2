export const broadcastModule = {
    category: 'owner',
    commands: {
        broadcast: {
            name: 'broadcast',
            alias: ['bc', 'bcgc'],
            run: async (m, { conn, isROwner }) => {
                if (!isROwner) return m.reply('solo desarrolladores');

                const rawText = m.text || m.body || '';
                const commandMatch = rawText.match(/^\.\w+\s+(.*)/s);
                const cleanText = commandMatch ? commandMatch[1] : '';

                const content = cleanText || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '');

                if (!content) return m.reply('⚠ USO INCORRECTO\n\nEscribe el mensaje o etiqueta contenido.');

                const dbChats = await global.Chat.find().lean();
                const getGroups = await conn.groupFetchAllParticipating();
                const groups = Object.values(getGroups);
                const activeJids = groups.map(v => v.id);

                const validChats = dbChats.filter(c => activeJids.includes(c.id) && !c.isBanned);

                if (validChats.length === 0) return m.reply('❌ No hay grupos activos en común con la base de datos.');

                await m.reply(`🚀 Enviando a ${validChats.length} grupos...`);

                let success = 0;
                let errors = 0;

                for (const chat of validChats) {
                    try {
                        if (m.quoted) {
                            await conn.copyNForward(chat.id, m.quoted.fakeObj, true);
                        } else {
                            const thumb = typeof img === 'function' ? img() : 'https://dix.lat';
                            await conn.sendMessage(chat.id, { 
                                text: content
                                
                            });
                        }
                        success++;
                        await new Promise(res => setTimeout(res, 2000));
                    } catch (e) {
                        errors++;
                    }
                }

                await m.reply(`✅ Finalizado\n\n✨ Éxito: ${success}\n❌ Error: ${errors}`);
            }
        }
    }
};
