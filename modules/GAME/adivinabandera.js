export const guessFlagCommand = {
    category: 'game',
    commands: {
        adivinabandera: {
            name: 'adivinabandera',
            alias: ['flag', 'bandera'],
            async before(m, { conn }) {
                global.flagGames = global.flagGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.flagGames[gameId];

                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || !game.msgIds.includes(quotedId)) return false;

                const userAns = (m.text || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!userAns) return false;

                game.intentos++;

                const isCorrect = game.correctAnswers.includes(userAns);

                if (isCorrect) {
                    await m.react('🎉');
                    await conn.sendMessage(m.chat, { text: `✅ ¡Correcto! La bandera es de *${game.name}*.` }, { quoted: m });
                    delete global.flagGames[gameId];
                } else {
                    if (game.intentos >= 2) {
                        await m.react('☠️');
                        await conn.sendMessage(m.chat, { text: `❌ Incorrecto. Has agotado tus 2 intentos.\n\n🏳️ La respuesta correcta era: *${game.name}*.` }, { quoted: m });
                        delete global.flagGames[gameId];
                    } else {
                        await m.react('❌');
                        const enviadoError = await conn.sendMessage(m.chat, { text: `❌ Incorrecto. ¡Te queda 1 último intento! Responde a este mensaje:` }, { quoted: m });
                        game.msgIds.push(enviadoError.key.id);
                    }
                }
                return true;
            },
            run: async (m, { conn }) => {
                global.flagGames = global.flagGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.flagGames[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes una partida activa. Responde al mensaje del juego anterior para continuar.` }, { quoted: m });
                }

                const flagsData = [
                    { emoji: '🇦🇷', name: 'Argentina', alias: ['argentina'] },
                    { emoji: '🇧🇷', name: 'Brasil', alias: ['brasil', 'brazil'] },
                    { emoji: '🇲🇽', name: 'México', alias: ['mexico', 'mextli'] },
                    { emoji: '🇨🇱', name: 'Chile', alias: ['chile'] },
                    { emoji: '🇨🇴', name: 'Colombia', alias: ['colombia'] },
                    { emoji: '🇵🇪', name: 'Perú', alias: ['peru'] },
                    { emoji: '🇪🇸', name: 'España', alias: ['espana', 'espana'] },
                    { emoji: '🇺🇸', name: 'Estados Unidos', alias: ['estados unidos', 'usa', 'eeuu', 'ee.uu'] },
                    { emoji: '🇫🇷', name: 'Francia', alias: ['francia', 'france'] },
                    { emoji: '🇮🇹', name: 'Italia', alias: ['italia', 'italy'] },
                    { emoji: '🇩🇪', name: 'Alemania', alias: ['alemania', 'germany'] },
                    { emoji: '🇯🇵', name: 'Japón', alias: ['japon', 'japan'] },
                    { emoji: '🇨🇦', name: 'Canadá', alias: ['canada'] },
                    { emoji: '🇬🇧', name: 'Reino Unido', alias: ['reino unido', 'uk', 'inglaterra'] },
                    { emoji: '🇻🇪', name: 'Venezuela', alias: ['venezuela'] },
                    { emoji: '🇪🇨', name: 'Ecuador', alias: ['ecuador'] },
                    { emoji: '🇺🇾', name: 'Uruguay', alias: ['uruguay'] },
                    { emoji: '🇵🇾', name: 'Paraguay', alias: ['paraguay'] },
                    { emoji: '🇧🇴', name: 'Bolivia', alias: ['bolivia'] },
                    { emoji: '🇨🇷', name: 'Costa Rica', alias: ['costa rica'] },
                    { emoji: '🇵🇦', name: 'Panáma', alias: ['panama'] },
                    { emoji: '🇨🇺', name: 'Cuba', alias: ['cuba'] },
                    { emoji: '🇩🇴', name: 'República Dominicana', alias: ['republica dominicana', 'rd'] },
                    { emoji: '🇵🇹', name: 'Portugal', alias: ['portugal'] },
                    { emoji: '🇨🇳', name: 'China', alias: ['china'] },
                    { emoji: '🇰🇷', name: 'Corea del Sur', alias: ['corea del sur', 'korea'] },
                    { emoji: '🇷🇺', name: 'Rusia', alias: ['rusia', 'russia'] },
                    { emoji: '🇦🇺', name: 'Australia', alias: ['australia'] },
                    { emoji: '🇪🇬', name: 'Egipto', alias: ['egipto', 'egypt'] },
                    { emoji: '🇿🇦', name: 'Sudáfrica', alias: ['sudafrica', 'south africa'] },
                    { emoji: '🇬🇷', name: 'Grecia', alias: ['grecia', 'greece'] },
                    { emoji: '🇨🇭', name: 'Suiza', alias: ['suiza', 'switzerland'] },
                    { emoji: '🇳🇱', name: 'Países Bajos', alias: ['paises bajos', 'holanda', 'netherlands'] },
                    { emoji: '🇧🇪', name: 'Bélgica', alias: ['belgica', 'belgium'] },
                    { emoji: '🇸🇪', name: 'Suecia', alias: ['suecia', 'sweden'] },
                    { emoji: '🇳🇴', name: 'Noruega', alias: ['noruega', 'norway'] },
                    { emoji: '🇮🇪', name: 'Irlanda', alias: ['irlanda', 'ireland'] },
                    { emoji: '🇮🇳', name: 'India', alias: ['india'] },
                    { emoji: '🇸🇦', name: 'Arabia Saudita', alias: ['arabia saudita', 'arabia'] },
                    { emoji: '🇹🇷', name: 'Turquía', alias: ['turquia', 'turkey'] },
                    { emoji: '🇲🇦', name: 'Marruecos', alias: ['marruecos', 'morocco'] },
                    { emoji: '🇳🇿', name: 'Nueva Zelanda', alias: ['nueva zelanda', 'new zealand'] },
                    { emoji: '🇺🇦', name: 'Ucrania', alias: ['ucrania', 'ukraine'] },
                    { emoji: '🇸🇬', name: 'Singapur', alias: ['singapur', 'singapore'] },
                    { emoji: '🇵🇭', name: 'Filipinas', alias: ['filipinas', 'philippines'] },
                    { emoji: '🇲🇾', name: 'Malasia', alias: ['malasia', 'malaysia'] },
                    { emoji: '🇹🇭', name: 'Tailandia', alias: ['tailandia', 'thailand'] },
                    { emoji: '🇻🇳', name: 'Vietnam', alias: ['vietnam'] },
                    { emoji: '🇮🇩', name: 'Indonesia', alias: ['indonesia'] },
                    { emoji: '🇦🇹', name: 'Austria', alias: ['austria'] }
                ];

                const randomFlag = flagsData[Math.floor(Math.random() * flagsData.length)];
                const cleanAnswers = randomFlag.alias.map(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

                const texto = `🏁 *Adivina la Bandera*\n\n¿A qué país pertenece esta bandera?\n\n${randomFlag.emoji}\n\n📌 *Nota:* Tienes un máximo de 2 intentos. Debes responder directamente a este mensaje.`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.flagGames[gameId] = { name: randomFlag.name, correctAnswers: cleanAnswers, msgIds: [enviado.key.id], intentos: 0 };
                return true;
            }
        }
    }
};
