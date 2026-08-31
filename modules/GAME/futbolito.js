export const FutbolitoCommand = {
    category: 'JUEGOS',
    commands: {
        futbolito: {
            name: 'futbolito',
            alias: ['penalties', 'torneo', 'equiposfutbol'],
            group: true,
            run: async function (m, { conn, args, chat }) {
                try {
                    const equiposDisponibles = {
                        'realmadrid': 'Real Madrid ⚪',
                        'barcelona': 'FC Barcelona 🔵🔴',
                        'boca': 'Boca Juniors 💙💛',
                        'river': 'River Plate ⚪🔴',
                        'mexico': 'Selección Mexicana 🇲🇽',
                        'argentina': 'Selección Argentina 🇦🇷',
                        'espana': 'Selección Española 🇪🇸',
                        'brasil': 'Selección Brasileña 🇧🇷'
                    };

                    let modo = args[0]?.toLowerCase();
                    let equipoClave = args[1]?.toLowerCase();
                    let apuesta = parseInt(args[2]) || 1000;

                    if (!modo || !['partido', 'penales', 'torneo'].includes(modo)) {
                        let txt = `*» MODOS DE JUEGO DE FUTBOLITO «*\n\n` +
                                  `⚽ *1. partido* : Enfrentamiento directo 90 min.\n` +
                                  `⚽ *2. penales* : Definición por tanda de penaltis.\n` +
                                  `⚽ *3. torneo* : Torneo express con semifinal y final.\n\n` +
                                  `*» EQUIPOS DISPONIBLES «*\n` +
                                  `• \`realmadrid\` | \`barcelona\`\n` +
                                  `• \`boca\` | \`river\`\n` +
                                  `• \`mexico\` | \`argentina\`\n` +
                                  `• \`espana\` | \`brasil\`\n\n` +
                                  `📌 *Uso:* .futbolito <modo> <equipo> <apuesta>\n` +
                                  `📌 *Ejemplo:* .futbolito partido realmadrid 5000`;
                        return conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                    }

                    if (!equipoClave || !equiposDisponibles[equipoClave]) {
                        return conn.sendMessage(m.chat, { text: `*» Estado* : Selecciona un equipo válido del catálogo` }, { quoted: m });
                    }

                    let userDb = await global.User.findOne({ id: m.sender });
                    let saldo = userDb?.money || userDb?.coins || 0;

                    if (saldo < apuesta) {
                        return conn.sendMessage(m.chat, { text: `*» Estado* : Fondos insuficientes para cubrir la entrada ($${apuesta.toLocaleString()})` }, { quoted: m });
                    }

                    let miEquipo = equiposDisponibles[equipoClave];
                    let clavesEquipos = Object.keys(equiposDisponibles).filter(k => k !== equipoClave);
                    let rivalClave = clavesEquipos[Math.floor(Math.random() * clavesEquipos.length)];
                    let equipoRival = equiposDisponibles[rivalClave];

                    if (modo === 'partido') {
                        let golesLocal = Math.floor(Math.random() * 5);
                        let golesRival = Math.floor(Math.random() * 5);

                        let resultadoTxt = `*» FUTBOLITO - PARTIDO 90 MIN «*\n` +
                                           `🏟️ *Marcador Final*:\n` +
                                           `• ${miEquipo}: ${golesLocal}\n` +
                                           `• ${equipoRival}: ${golesRival}\n\n`;

                        if (golesLocal > golesRival) {
                            let ganancia = apuesta * 2;
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: apuesta, coins: apuesta } });
                            resultadoTxt += `🎉 *¡VICTORIA!* Has ganado +$${apuesta.toLocaleString()}`;
                        } else if (golesLocal === golesRival) {
                            resultadoTxt += `🤝 *EMPATE*. Se devuelve la apuesta base ($${apuesta.toLocaleString()})`;
                        } else {
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: -apuesta, coins: -apuesta } });
                            resultadoTxt += `❌ *DERROTA*. Has perdido -$${apuesta.toLocaleString()}`;
                        }

                        return conn.sendMessage(m.chat, { text: resultadoTxt }, { quoted: m });
                    }

                    if (modo === 'penales') {
                        let aciertosLocal = 0;
                        let aciertosRival = 0;

                        for (let i = 0; i < 5; i++) {
                            if (Math.random() < 0.70) aciertosLocal++;
                            if (Math.random() < 0.70) aciertosRival++;
                        }

                        let resultadoTxt = `*» FUTBOLITO - TANDA DE PENALES «*\n` +
                                           `🥅 *Resultado de la Tanda*:\n` +
                                           `• ${miEquipo}: ${aciertosLocal}/5\n` +
                                           `• ${equipoRival}: ${aciertosRival}/5\n\n`;

                        if (aciertosLocal > aciertosRival) {
                            let premio = Math.floor(apuesta * 1.8);
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: premio - apuesta, coins: premio - apuesta } });
                            resultadoTxt += `🧤 *¡GANASTE LA TANDA!* Premio acumulado: +$${(premio - apuesta).toLocaleString()}`;
                        } else if (aciertosLocal === aciertosRival) {
                            resultadoTxt += `🤝 *EMPATE EN PENALES*. Reembolso de $${apuesta.toLocaleString()}`;
                        } else {
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: -apuesta, coins: -apuesta } });
                            resultadoTxt += `❌ *EL ARQUERO RIVAL FUE FIGURA*. Perdiste -$${apuesta.toLocaleString()}`;
                        }

                        return conn.sendMessage(m.chat, { text: resultadoTxt }, { quoted: m });
                    }

                    if (modo === 'torneo') {
                        let gSemiLocal = Math.floor(Math.random() * 4) + 1;
                        let gSemiRival = Math.floor(Math.random() * 3);

                        if (gSemiLocal <= gSemiRival) {
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: -apuesta, coins: -apuesta } });
                            let txt = `*» TORNEO EXPRESS - SEMIFINAL «*\n` +
                                      `• ${miEquipo}: ${gSemiLocal}\n` +
                                      `• ${equipoRival}: ${gSemiRival}\n\n` +
                                      `❌ Eliminado en semifinales. Pérdida: -$${apuesta.toLocaleString()}`;
                            return conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        }

                        let rivalFinalKey = clavesEquipos.filter(k => k !== rivalClave)[0];
                        let equipoRivalFinal = equiposDisponibles[rivalFinalKey];
                        let gFinalLocal = Math.floor(Math.random() * 3) + 1;
                        let gFinalRival = Math.floor(Math.random() * 3);

                        if (gFinalLocal > gFinalRival) {
                            let granPremio = apuesta * 3;
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: granPremio - apuesta, coins: granPremio - apuesta } });
                            let txt = `*» TORNEO EXPRESS - CAMPEÓN «*\n` +
                                      `🔹 *Semifinal*: ${miEquipo} ${gSemiLocal} - ${gSemiRival} ${equipoRival}\n` +
                                      `🏆 *Gran Final*: ${miEquipo} ${gFinalLocal} - ${gFinalRival} ${equipoRivalFinal}\n\n` +
                                      `👑 *¡CAMPEÓN DEL TORNEO!* Premio mayor: +$${(granPremio - apuesta).toLocaleString()}`;
                            return conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        } else {
                            await global.User.findOneAndUpdate({ id: m.sender }, { $inc: { money: -apuesta, coins: -apuesta } });
                            let txt = `*» TORNEO EXPRESS - SUBCAMPEÓN «*\n` +
                                      `🔹 *Semifinal*: Avanzaste con victoria\n` +
                                      `🥈 *Gran Final*: ${miEquipo} ${gFinalLocal} - ${gFinalRival} ${equipoRivalFinal}\n\n` +
                                      `💔 Caíste en la final. Perdiste -$${apuesta.toLocaleString()}`;
                            return conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        }
                    }

                } catch (err) {
                    await conn.sendMessage(m.chat, { text: `*» Estado* : Error en juego de futbolito (${err.message})` }, { quoted: m });
                }
            }
        }
    }
};
