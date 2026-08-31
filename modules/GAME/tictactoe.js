const renderVisualBoard = (board) => {
    const b = board.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕'));
    return `╔═══╦═══╦═══╗\n║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n╠═══╬═══╬═══╣\n║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n╠═══╬═══╬═══╣\n║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n╚═══╩═══╩═══╝`;
};

const checkWin = (b) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) if (b[w[0]] !== ' ' && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]];
    return b.includes(' ') ? null : 'tie';
};

export const ticTacToeCommand = {
    category: 'game',
    commands: {
        tictactoe: {
            name: 'tictactoe',
            alias: ['ttt', 'x0', 'tresenraya', 'delttt', 'salirttt'],
            async before(m, { conn }) {
                global.tttGames = global.tttGames || {};
                const game = global.tttGames[m.chat];
                if (!game || m.isBaileys || m.fromMe) return false;

                const txt = (m.text || '').trim();

                if (['DELTTT', 'SALIRTTT', 'ABANDONAR'].includes(txt.toUpperCase())) {
                    if (m.sender !== game.playerX && m.sender !== game.playerO) return false;
                    await m.react('👋');
                    await conn.sendMessage(m.chat, {
                        text: `🏁 *PARTIDA FINALIZADA*\n\n@${m.sender.split('@')[0]} ha decidido abandonar la partida.`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.tttGames[m.chat];
                    return true;
                }

                if (!/^[1-9]$/.test(txt)) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                if (m.sender !== game.playerX && m.sender !== game.playerO) return false;

                const currentTurnJid = game.turn === 'X' ? game.playerX : game.playerO;
                if (m.sender !== currentTurnJid) { await m.react('⏳'); return true; }

                const position = parseInt(txt) - 1;
                if (game.board[position] !== ' ') { await m.react('❓'); return true; }

                game.board[position] = game.turn;
                await m.react('✅');

                const winner = checkWin(game.board);
                if (winner) {
                    const winnerJid = winner === 'X' ? game.playerX : game.playerO;
                    let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`;

                    if (winner === 'tie') {
                        await conn.sendMessage(m.chat, { text: finalMsg + `⚖️ *¡Es un EMPATE!*` }, { quoted: m });
                    } else {
                        await conn.sendMessage(m.chat, {
                            text: finalMsg + `🏆 *¡@${winnerJid.split('@')[0]} (${winner}) ES EL GANADOR!*`,
                            contextInfo: { mentionedJid: [winnerJid] }
                        }, { quoted: m });
                    }
                    delete global.tttGames[m.chat];
                    return true;
                }

                game.turn = game.turn === 'X' ? 'O' : 'X';
                const nextJid = game.turn === 'X' ? game.playerX : game.playerO;
                const nextText = `🎮 *TRES EN RAYA*\n\n${renderVisualBoard(game.board)}\n\nSigue el turno de *${game.turn}*: @${nextJid.split('@')[0]}\n\n📌 *Nota:* Responde a este mensaje con un número (1-9).\nSi deseas rendirte escribe *salirttt*.`;

                const enviadoSiguiente = await conn.sendMessage(m.chat, {
                    text: nextText,
                    contextInfo: { mentionedJid: [nextJid] }
                }, { quoted: m });

                game.msgId = enviadoSiguiente.key.id;
                return true;
            },
            run: async (m, { conn, usedPrefix, command }) => {
                global.tttGames = global.tttGames || {};

                if (['delttt', 'salirttt'].includes(command.toLowerCase())) {
                    if (!global.tttGames[m.chat]) {
                        return conn.sendMessage(m.chat, { text: `⚠️ No hay ninguna partida activa en este grupo.` }, { quoted: m });
                    }
                    const game = global.tttGames[m.chat];
                    if (m.sender !== game.playerX && m.sender !== game.playerO) {
                        return conn.sendMessage(m.chat, { text: `❌ Solo los jugadores participantes pueden cancelar la partida.` }, { quoted: m });
                    }
                    delete global.tttGames[m.chat];
                    return conn.sendMessage(m.chat, { text: `🏁 La partida ha sido cancelada exitosamente.` }, { quoted: m });
                }

                if (global.tttGames[m.chat]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya hay una partida activa en este grupo.` }, { quoted: m });
                }
                if (!m.isGroup) {
                    return conn.sendMessage(m.chat, { text: `❌ Solo se puede jugar dentro de grupos.` }, { quoted: m });
                }

                const opponent = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
                if (!opponent) {
                    return conn.sendMessage(m.chat, { text: `❌ Menciona a tu oponente usando: *${usedPrefix}${command} @user*` }, { quoted: m });
                }
                if (opponent === m.sender) {
                    return conn.sendMessage(m.chat, { text: `❌ No puedes jugar contra ti mismo.` }, { quoted: m });
                }

                const p1 = m.sender.split('@')[0];
                const p2 = opponent.split('@')[0];
                const boardStr = '╔═══╦═══╦═══╗\n║ ⬜ ║ ⬜ ║ ⬜ ║  (1-3)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (4-6)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (7-9)\n╚═══╩═══╩═══╝';

                const textoInicio = `🎮 *TRES EN RAYA - INICIO*\n\n@${p1} (❌) vs @${p2} (⭕)\n\n${boardStr}\n\nEmpieza el turno de *❌*: @${p1}\n\n📌 *Nota:* Responde directamente al tablero para realizar tu movimiento.`;

                const enviado = await conn.sendMessage(m.chat, {
                    text: textoInicio,
                    contextInfo: { mentionedJid: [m.sender, opponent] }
                }, { quoted: m });

                global.tttGames[m.chat] = {
                    board: Array(9).fill(' '),
                    playerX: m.sender,
                    playerO: opponent,
                    turn: 'X',
                    msgId: enviado.key.id
                };
                return true;
            }
        }
    }
};
