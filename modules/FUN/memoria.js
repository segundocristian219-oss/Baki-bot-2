global.juegosMemoria = global.juegosMemoria || {};

export const memoriaModule = {
    category: 'FUN',
    commands: {
        memoria: {
            name: 'memoria',
            alias: ['patron', 'recordar', 'simon'],
            desc: 'Juego de memoria por niveles con borrado de mensaje en 5 segundos.',
            run: async (m, { conn, args }) => {
                const userId = m.sender;
                const fichas = ['🟥', '🟦', '🟩', '🟨', '🟧', '🟪'];

                if (args[0] && (args[0].toLowerCase() === 'rendirse' || args[0].toLowerCase() === 'stop')) {
                    if (!global.juegosMemoria[userId]) {
                        return m.reply('> No tienes ninguna partida activa en este momento.');
                    }
                    const nivelAlcanzado = global.juegosMemoria[userId].nivel;
                    delete global.juegosMemoria[userId];
                    return m.reply(`🏳️ *Partida finalizada.* Abandonaste la partida en el **Nivel ${nivelAlcanzado}**.`);
                }

                if (!global.juegosMemoria[userId]) {
                    const secuenciaInicial = [
                        fichas[Math.floor(Math.random() * 4)],
                        fichas[Math.floor(Math.random() * 4)]
                    ];

                    global.juegosMemoria[userId] = {
                        patron: secuenciaInicial,
                        nivel: 1,
                        vidas: 2
                    };

                    const textoInicio = 
                        `🧠 *JUEGO DE MEMORIA - NIVEL 1*\n\n` +
                        `• *Vidas:* ❤️❤️\n` +
                        `• *Secuencia a memorizar:*\n` +
                        `👉 ${secuenciaInicial.join(' ')}\n\n` +
                        `⚠️ *Este mensaje se borrará en 5 segundos...*`;

                    const sentMsg = await conn.sendMessage(m.chat, {
                        text: textoInicio
                    }, { quoted: m });

                    setTimeout(async () => {
                        await conn.sendMessage(m.chat, { delete: sentMsg.key }).catch(() => null);
                    }, 5000);

                    return;
                }

                const juego = global.juegosMemoria[userId];
                const respuestaUsuario = args.join(' ').trim();
                const patronCorrecto = juego.patron.join(' ');

                if (!respuestaUsuario) {
                    return m.reply(
                        `📌 *PARTIDA EN CURSO (Nivel ${juego.nivel})*\n\n` +
                        `• *Vidas restantes:* ${'❤️'.repeat(juego.vidas)}\n\n` +
                        `Escribe tu respuesta con: \`.memoria <secuencia>\``
                    );
                }

                if (respuestaUsuario === patronCorrecto) {
                    juego.nivel += 1;

                    let poolFichas = 4;
                    if (juego.nivel >= 5) poolFichas = 5;
                    if (juego.nivel >= 8) poolFichas = 6;

                    juego.patron.push(fichas[Math.floor(Math.random() * poolFichas)]);

                    const textoVictoria = 
                        `✨ *¡SECUENCIA CORRECTA!*\n\n` +
                        `🏆 *Avanzas al Nivel ${juego.nivel}*\n` +
                        `• *Vidas:* ${'❤️'.repeat(juego.vidas)}\n\n` +
                        `*Nueva secuencia:*\n` +
                        `👉 ${juego.patron.join(' ')}\n\n` +
                        `⚠️ *Este mensaje se borrará en 5 segundos...*`;

                    const sentMsg = await conn.sendMessage(m.chat, {
                        text: textoVictoria
                    }, { quoted: m });

                    setTimeout(async () => {
                        await conn.sendMessage(m.chat, { delete: sentMsg.key }).catch(() => null);
                    }, 5000);

                    return;
                } else {
                    juego.vidas -= 1;

                    if (juego.vidas > 0) {
                        return m.reply(
                            `❌ *¡SECUENCIA INCORRECTA!*\n\n` +
                            `Te queda **${juego.vidas} vida** ❤️.\n` +
                            `Inténtalo de nuevo enviando la respuesta correcta con \`.memoria <secuencia>\`.`
                        );
                    } else {
                        const nivelFinal = juego.nivel;
                        delete global.juegosMemoria[userId];
                        return m.reply(
                            `💥 *¡GAME OVER!*\n\n` +
                            `Has agotado todas tus vidas.\n` +
                            `• *La secuencia era:* ${patronCorrecto}\n` +
                            `• *Nivel máximo alcanzado:* ${nivelFinal}\n\n` +
                            `Escribe \`.memoria\` para empezar un juego nuevo.`
                        );
                    }
                }
            }
        }
    }
};
