export const guessNumberCommand = {
    category: 'game',
    commands: {
        adivinanumero: {
            name: 'adivinanumero',
            alias: ['guess'],
            async before(m, { conn }) {
                global.guessGames = global.guessGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.guessGames[gameId];

                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const txt = parseInt((m.text || '').trim());
                if (isNaN(txt)) return false;

                game.intentos++;

                if (txt === game.secreto) {
                    await m.react('🎉');
                    await conn.sendMessage(m.chat, { text: `✅ ¡Exacto! Era el *${game.secreto}*. Lo lograste en *${game.intentos}* intentos.` }, { quoted: m });
                    delete global.guessGames[gameId];
                } else {
                    await m.react(txt < game.secreto ? '⬆️' : '⬇️');
                    const pista = txt < game.secreto ? 'Es un número *MAYOR*.' : 'Es un número *MENOR*.';
                    await conn.sendMessage(m.chat, { text: pista }, { quoted: m });
                }
                return true;
            },
            run: async (m, { conn }) => {
                global.guessGames = global.guessGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.guessGames[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes una partida activa. Responde al mensaje del juego anterior para continuar.` }, { quoted: m });
                }

                const secreto = Math.floor(Math.random() * 100) + 1;
                const texto = `🔢 *Adivina el Número*\n\nHe pensado un número del 1 al 100. ¡Intenta adivinarlo!\n\n📌 *Nota:* Debes responder directamente a este mensaje para que tu intento sea válido.`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.guessGames[gameId] = { secreto, intentos: 0, msgId: enviado.key.id };
                return true;
            }
        }
    }
};
