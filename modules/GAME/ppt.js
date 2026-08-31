export const pptCommand = {
    category: 'game',
    commands: {
        ppt: {
            name: 'ppt',
            alias: ['piedrapapeltijera', 'jugarppt'],
            async before(m, { conn }) {
                global.pptMemory = global.pptMemory || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.pptMemory[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const opciones = ['PIEDRA', 'PAPEL', 'TIJERA'];
                const usuario = m.text.trim().toUpperCase();
                if (!opciones.includes(usuario)) return false;

                game.intentos = (game.intentos || 0) + 1;

                let bot;
                const rand = Math.random();

                if (game.history.length > 0 && rand < 0.7) {
                    const counts = game.history.reduce((acc, move) => {
                        acc[move] = (acc[move] || 0) + 1;
                        return acc;
                    }, {});
                    const masJugado = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                    bot = masJugado === 'PIEDRA' ? 'PAPEL' : masJugado === 'PAPEL' ? 'TIJERA' : 'PIEDRA';
                } else {
                    bot = opciones[Math.floor(Math.random() * opciones.length)];
                }

                game.history.push(usuario);

                let resultado;
                if (usuario === bot) {
                    resultado = '🤝 *EMPATE*'; game.empates++;
                } else if (
                    (usuario === 'PIEDRA' && bot === 'TIJERA') ||
                    (usuario === 'PAPEL' && bot === 'PIEDRA') ||
                    (usuario === 'TIJERA' && bot === 'PAPEL')
                ) {
                    resultado = '🎉 *GANASTE*'; game.victorias++;
                } else {
                    resultado = '🤖 *PERDISTE*'; game.derrotas++;
                }

                await conn.sendMessage(m.chat, {
                    text: `🎮 *Ronda ${game.intentos}/3*\n\nTu: *${usuario}*\nBot: *${bot}*\n${resultado}`
                }, { quoted: m });

                if (game.intentos >= 3) {
                    const final = `🏁 *FIN DE LA PARTIDA*\n\nVictorias: ${game.victorias}\nDerrotas: ${game.derrotas}\nEmpates: ${game.empates}\n\n${game.victorias > game.derrotas ? '¡Eres un experto!' : '¡El Bot te dominó!'}`;
                    await conn.sendMessage(m.chat, { text: final }, { quoted: m });
                    delete global.pptMemory[gameId];
                }
                return true;
            },
            run: async (m, { conn }) => {
                global.pptMemory = global.pptMemory || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.pptMemory[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes una partida de 3 intentos en curso. Responde al mensaje del juego anterior.` }, { quoted: m });
                }

                const texto = `🎮 *Piedra, Papel o Tijera (Dificultad Alta)*\n\nEl bot analizará tu estrategia. ¡Intenta ganarle! Escribe *PIEDRA*, *PAPEL* o *TIJERA*.\n\n📌 *Nota:* Debes responder directamente a este mensaje para que tu jugada sea válida.`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.pptMemory[gameId] = {
                    intentos: 0, victorias: 0, derrotas: 0, empates: 0,
                    history: [], msgId: enviado.key.id
                };
                return true;
            }
        }
    }
};
