export const minionsModule = {
    category: 'FUN',
    commands: {
        minion: {
            name: 'minion',
            alias: ['minions', 'banana', 'papoi'],
            desc: 'Envía un mensaje al estilo Minion hacia un usuario.',
            run: async (m, { conn }) => {
                const menciones = m.mentionedJid || [];
                const usuario = menciones.length > 0 ? `@${menciones[0].split('@')[0]}` : 'a todos';

                const frasesMinion = [
                    `🍌 *Bello!* ${usuario}, Poopaye! Para tú! 💛`,
                    `🧸 *PAPOI! PAPOI!* Oye ${usuario}, ¡mira mi juguete favorito! ✨`,
                    `👀 *Tulaliloo ti amo!* ${usuario}, me das una banana o me enojo. 🍌`,
                    `🍦 *Gelatooo!* ${usuario}, de@seos un helado para combatir la calor.`,
                    `🤪 *Bello!* ${usuario}, Tank yu! Pero eres un completo Gelato. 🍦`,
                    `🍌 *BANANAAA!* ${usuario}, Tatata bala tu! ✨`,
                    `🍻 *Kampai!* Saludos de parte de Bob, Stuart y Kevin para ${usuario}. 💛`,
                    `🚀 *Underwear!* ${usuario}, ¡nos vamos a la luna con el jefe Gru! 🌕`,
                    `💥 *Bee-do Bee-do Bee-do!* ¡Alerta de emergencia con ${usuario}! 🚨`,
                    `🥔 *Pee-dock!* ${usuario}, ¿quién quiere papas fritas? 🍟`
                ];

                const fraseAleatoria = frasesMinion[Math.floor(Math.random() * frasesMinion.length)];

                return conn.sendMessage(m.chat, {
                    text: fraseAleatoria,
                    mentions: menciones
                }, { quoted: m });
            }
        }
    }
};
