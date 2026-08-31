/*import fs from 'fs';
import path from 'path';

export const actividadCommand = {
    category: 'group',
    commands: {
        actividad_stats: {
            name: 'actividad_stats',
            alias: ['activos', 'fantasmas', 'inactivos'],
            group: true,
            admin: true,
            run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participants = groupMetadata?.participants || [];
                    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                    const jsonPath = path.resolve('./database/actividad.json');
                    let dbActividad = {};

                    if (fs.existsSync(jsonPath)) {
                        try {
                            dbActividad = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                        } catch (err) {
                            console.error(err);
                        }
                    }

                    const groupActivity = dbActividad[m.chat] || {};

                    let data = participants.map(p => {
                        const userStats = groupActivity[p.id];
                        const isObject = typeof userStats === 'object' && userStats !== null;
                        
                        const totalMensajes = isObject ? (userStats.total || 0) : (userStats || 0);
                        const statsDetallados = isObject ? userStats : { total: totalMensajes };

                        return {
                            id: p.id,
                            admin: p.admin,
                            total: totalMensajes,
                            stats: statsDetallados
                        };
                    });

                    if (command === 'activos') {
                        let usuariosActivos = data.filter(u => u.total > 0 && u.id !== botJid);

                        if (usuariosActivos.length === 0) {
                            return conn.reply(m.chat, 'Info: Aun no hay registros de actividad en la base de datos de este grupo.', m);
                        }

                        usuariosActivos.sort((a, b) => b.total - a.total);

                        let txt = `\n`;

                        const topMiembros = usuariosActivos.slice(0, 150);
                        topMiembros.forEach((u, i) => {
                            let detalles = [];
                            if (u.stats.texto > 0) detalles.push(`Texto: ${u.stats.texto}`);
                            if (u.stats.imagen > 0) detalles.push(`Imagenes: ${u.stats.imagen}`);
                            if (u.stats.video > 0) detalles.push(`Videos: ${u.stats.video}`);
                            if (u.stats.audio > 0) detalles.push(`Audios: ${u.stats.audio}`);
                            if (u.stats.sticker > 0) detalles.push(`Stickers: ${u.stats.sticker}`);
                            
                            let desglose = detalles.length > 0 ? `\n` + detalles.map(d => `├ ${d}`).join('\n') : '';
                            if (desglose) {
                                desglose = desglose.replace('├', '╰');
                                desglose = desglose.split('\n').map((line, idx, arr) => idx === 0 && arr.length > 1 ? line.replace('╰', '├') : line).join('\n');
                            }

                            txt += `╭${i + 1}. @${u.id.split('@')[0]} ╼ ${u.total} mensajes\n`;
                            if (detalles.length > 0) {
                                detalles.forEach((d, dIdx) => {
                                    const prefix = dIdx === detalles.length - 1 ? '╰' : '├';
                                    txt += `${prefix} ${d}\n`;
                                });
                            }
                        });

                        return await conn.sendMessage(m.chat, {
                            product: {
                                productImage: {
                                    url: img(conn)
                                },
                                title: "TOP USUARIOS MAS ACTIVOS",
                                description: `Miembros activos: ${usuariosActivos.length}`,
                                retailerId: "1466", 
                                productId: "37199733896340479", 
                                productImageCount: 1,
                            },
                            businessOwnerJid: "50432955554@s.whatsapp.net",
                            footer: txt.trim(),
                            mentions: topMiembros.map(u => u.id)
                        }, { messageType: 'product', quoted: m });
                    }

                    if (['fantasmas', 'inactivos'].includes(command)) {
                        const fantasmas = data.filter(u => u.total === 0 && u.id !== botJid);

                        if (fantasmas.length === 0) {
                            return conn.reply(m.chat, 'Info: No hay usuarios inactivos detectados en este grupo.', m);
                        }

                        if (args[0] === 'kick' || args[0] === 'eliminar') {
                            if (!isAdmin) return global.dfail('admin', m, conn);
                            if (!isBotAdmin) return global.dfail('botAdmin', m, conn);

                            await conn.reply(m.chat, `Procediendo a eliminar a ${fantasmas.length} miembros inactivos...`, m);

                            for (let fantasma of fantasmas) {
                                await conn.groupParticipantsUpdate(m.chat, [fantasma.id], 'remove');
                                await new Promise(r => setTimeout(r, 1500)); 
                            }
                            return conn.reply(m.chat, 'Limpieza de inactivos completada con exito.', m);
                        }

                        let txt = `Para eliminarlos usa: ${usedPrefix + command} kick\n\n`;

                        fantasmas.forEach((u, i) => {
                            txt += `${i + 1}. @${u.id.split('@')[0]}\n`;
                        });

                        return await conn.sendMessage(m.chat, {
                            product: {
                                productImage: {
                                    url: img(conn)
                                },
                                title: "LISTA DE INACTIVOS / FANTASMAS",
                                description: `Total detectados: ${fantasmas.length}`,
                                retailerId: "1466", 
                                productId: "37199733896340479", 
                                productImageCount: 1,
                            },
                            businessOwnerJid: "50432955554@s.whatsapp.net",
                            footer: txt.trim(),
                            mentions: fantasmas.map(u => u.id)
                        }, { messageType: 'product', quoted: m });
                    }

                } catch (e) {
                    console.error(e);
                    conn.reply(m.chat, 'Ocurrio un error interno.', m);
                }
            }
        }
    }
};
*/