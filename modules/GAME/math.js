export const mathCommand = {
    category: 'game',
    commands: {
        math: {
            name: 'math',
            alias: ['mate', 'calculo'],
            async before(m, { conn }) {
                const txt = (m.text || '').trim();
                if (!txt || m.isBaileys || m.fromMe || /^[#!./]/.test(txt)) return false;

                global.mathGames = global.mathGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                if (!global.mathGames[gameId]) return false;

                const game = global.mathGames[gameId];
                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const userAns = parseInt(txt);
                if (isNaN(userAns)) return false;

                if (userAns === game.result) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `🎉 ¡@${m.sender.split('@')[0]} eres un genio matemático!\n\nLa respuesta correcta era: *${game.result}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.mathGames[gameId];
                    return true;
                } else {
                    game.attempts++;
                    await m.react('❌');

                    if (game.attempts >= 2) {
                        await conn.sendMessage(m.chat, {
                            text: `❌ *JUEGO TERMINADO*\n\nSe agotaron los intentos, @${m.sender.split('@')[0]}.\nLa respuesta era: *${game.result}*`,
                            contextInfo: { mentionedJid: [m.sender] }
                        }, { quoted: m });
                        delete global.mathGames[gameId];
                        return true;
                    }

                    const hint = Math.abs(userAns - game.result) < 5
                        ? '¡Estás muy cerca!'
                        : (userAns < game.result ? 'Es un número más alto.' : 'Es un número más bajo.');

                    await conn.sendMessage(m.chat, {
                        text: `❌ *Incorrecto* @${m.sender.split('@')[0]}\n💡 ${hint}\n_Intento ${game.attempts}/2_\n\n📌 *Nota:* Recuerda responder citando el mensaje del reto original.`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    return true;
                }
            },
            run: async (m, { conn, text, usedPrefix, command }) => {
                global.mathGames = global.mathGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.mathGames[gameId]) {
                    return conn.sendMessage(m.chat, {
                        text: `⚠️ Ya tienes un reto activo, @${m.sender.split('@')[0]}. Resuelve: *${global.mathGames[gameId].equation}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                }

                const args = text ? text.trim().toLowerCase() : '';

                if (!['bajo', 'medio', 'alto'].includes(args)) {
                    return conn.sendMessage(m.chat, {
                        text: `🧮 *RETO MATEMÁTICO PERSONAL*\n\nSelecciona un nivel de dificultad:\n\n🟢 *${usedPrefix}${command} bajo*\n(Sumas y restas sencillas)\n\n🟡 *${usedPrefix}${command} medio*\n(Operaciones mixtas intermedias)\n\n🔴 *${usedPrefix}${command} alto*\n(Multiplicaciones avanzadas y retos complejos)`
                    }, { quoted: m });
                }

                let op, num1, num2;
                if (args === 'bajo') {
                    const ops = ['+', '-'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = Math.floor(Math.random() * 30) + 1;
                    num2 = Math.floor(Math.random() * 30) + 1;
                } else if (args === 'medio') {
                    const ops = ['+', '-', '*'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = op === '*' ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 100) + 1;
                    num2 = op === '*' ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 100) + 1;
                } else {
                    const ops = ['+', '-', '*'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = op === '*' ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 900) + 100;
                    num2 = op === '*' ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 900) + 100;
                }

                const equation = `${num1} ${op} ${num2}`;
                const result = eval(equation);

                const textoReto = `🧮 *RETO MATEMÁTICO - NIVEL ${args.toUpperCase()}*\n\nHola @${m.sender.split('@')[0]}, resuelve:\n\n💡 *${equation}*\n\n_Solo tú puedes responder. Tienes 2 intentos._\n\n📌 *Nota:* Debes responder directamente a este mensaje.`;

                const enviado = await conn.sendMessage(m.chat, {
                    text: textoReto,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });

                global.mathGames[gameId] = { equation, result, attempts: 0, msgId: enviado.key.id };
                return true;
            }
        }
    }
};
