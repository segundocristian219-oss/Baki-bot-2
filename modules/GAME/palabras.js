const words = ["computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", "planeta", "perro", "gato", "hierro", "sapo", "oro", "tecnología"];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
const clean = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const palabrasCommand = {
    category: 'game',
    commands: {
        adivina: {
            name: 'adivina',
            alias: ['palabra'],
            async before(m, { conn }) {
                const txt = (m.text || '').trim();
                if (!txt || m.isBaileys || m.fromMe || /^[#!./]/.test(txt)) return false;

                global.wordGames = global.wordGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                if (!global.wordGames[gameId]) return false;

                const game = global.wordGames[gameId];
                const userGuess = clean(txt);
                const correctAnswer = clean(game.original);

                if (userGuess === correctAnswer) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `♛ ¡@${m.sender.split('@')[0]} ganaste!\n\nLa palabra era: *${game.original.toUpperCase()}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.wordGames[gameId];
                    return true;
                } else {
                    game.attempts++;
                    await m.react('❌');

                    if (game.attempts >= 3) {
                        await conn.sendMessage(m.chat, {
                            text: `✘ *JUEGO TERMINADO*\n\nSe agotaron los 3 intentos, @${m.sender.split('@')[0]}.\nLa palabra era: *${game.original.toUpperCase()}*`,
                            contextInfo: { mentionedJid: [m.sender] }
                        }, { quoted: m });
                        delete global.wordGames[gameId];
                        return true;
                    }

                    const orig = game.original;
                    const mid = Math.floor(orig.length / 2);
                    const hints = [
                        `Pista: Inicia con *${orig[0]}* y termina con *${orig[orig.length - 1]}*`,
                        `Pista: La letra media es *${orig[mid]}* y termina con *${orig[orig.length - 1]}*`,
                        `Pista: Inicia con *${orig[0]}* y la letra media es *${orig[mid]}*`
                    ];
                    const randomHint = hints[Math.floor(Math.random() * hints.length)];

                    await conn.sendMessage(m.chat, {
                        text: `×᷼× *Incorrecto* @${m.sender.split('@')[0]}\n(Intento ${game.attempts}/3)\n⍰ ${randomHint}`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    return true;
                }
            },
            run: async (m, { conn }) => {
                global.wordGames = global.wordGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.wordGames[gameId]) {
                    return conn.sendMessage(m.chat, {
                        text: `♛ Ya tienes un juego activo: *${global.wordGames[gameId].scrambled.toUpperCase()}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                }

                const original = words[Math.floor(Math.random() * words.length)];
                global.wordGames[gameId] = { original, scrambled: shuffle(original), attempts: 0 };

                return conn.sendMessage(m.chat, {
                    text: `⍰ *ADIVINA LA PALABRA*\n\nHola @${m.sender.split('@')[0]}, ordena:\n*${global.wordGames[gameId].scrambled.toUpperCase()}*\n\n_Solo tú puedes responder. Tienes 3 intentos._`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
            }
        }
    }
};
