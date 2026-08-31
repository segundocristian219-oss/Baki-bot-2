const data = [
  { emojis: "🚢🧊🎻", respuesta: "TITANIC" },
  { emojis: "🦁👑🌅", respuesta: "EL REY LEON" },
  { emojis: "🧙‍♂️💍🌋", respuesta: "EL SEÑOR DE LOS ANILLOS" },
  { emojis: "🐭🎈🏠", respuesta: "UP" },
  { emojis: "🕸️🕷️🏙️", respuesta: "SPIDERMAN" },
  { emojis: "🧸🤠🚀", respuesta: "TOY STORY" },
  { emojis: "🕶️💊🔴", respuesta: "MATRIX" },
  { emojis: "🦈🌊🏖️", respuesta: "JAWS" },
  { emojis: "🦖🏝️🚙", respuesta: "JURASSIC PARK" },
  { emojis: "⚡👦👓", respuesta: "HARRY POTTER" },
  { emojis: "🚀🌌🤖", respuesta: "STAR WARS" },
  { emojis: "🤡🎈🏠", respuesta: "IT" },
  { emojis: "🥊🥩🏃", respuesta: "ROCKY" },
  { emojis: "🍌🐒🌴", respuesta: "KING KONG" },
  { emojis: "🍫🏭🎩", respuesta: "CHARLIE Y LA FABRICA DE CHOCOLATE" },
  { emojis: "🕵️‍♂️🔦💎", respuesta: "SHERLOCK HOLMES" },
  { emojis: "🌌👽🚲", respuesta: "ET" },
  { emojis: "🧊🚢🏔️", respuesta: "FROZEN" },
  { emojis: "👻🚫🏢", respuesta: "CAZAFANTASMAS" },
  { emojis: "🚗💨🏁", respuesta: "RAPIDO Y FURIOSO" }
];

export const emojiQuizCommand = {
    category: 'game',
    commands: {
        emojiquiz: {
            name: 'emojiquiz',
            alias: ['cineemoji', 'adivina'],
            async before(m, { conn }) {
                global.quizGames = global.quizGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.quizGames[gameId];

                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const txt = (m.text || '').trim().toUpperCase();

                if (txt === game.respuesta) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, { text: `🎉 ¡Correcto! La película era: *${game.respuesta}*` }, { quoted: m });
                    delete global.quizGames[gameId];
                    return true;
                } else {
                    game.intentos -= 1;
                    if (game.intentos <= 0) {
                        await m.react('❌');
                        await conn.sendMessage(m.chat, { text: `❌ ¡Se acabaron los intentos! La respuesta era: *${game.respuesta}*` }, { quoted: m });
                        delete global.quizGames[gameId];
                    } else {
                        await m.react('⏳');
                        await conn.sendMessage(m.chat, { text: `❌ Incorrecto. Te quedan *${game.intentos}* intentos.` }, { quoted: m });
                    }
                    return true;
                }
            },
            run: async (m, { conn }) => {
                global.quizGames = global.quizGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.quizGames[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes un juego activo. Responde al mensaje del juego anterior para continuar.` }, { quoted: m });
                }

                let lastIndex = global.lastQuizIndex || -1;
                let randomIndex;
                do { randomIndex = Math.floor(Math.random() * data.length); }
                while (randomIndex === lastIndex && data.length > 1);

                global.lastQuizIndex = randomIndex;
                const reto = data[randomIndex];

                const texto = `🎬 *Emoji Quiz*\n\n¿Qué película es?\n\n*${reto.emojis}*\n\n_Tienes 3 intentos._\n\n📌 *Nota:* Debes responder directamente a este mensaje para que tu respuesta sea válida.`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.quizGames[gameId] = {
                    respuesta: reto.respuesta,
                    intentos: 3,
                    msgId: enviado.key.id
                };

                return true;
            }
        }
    }
};
