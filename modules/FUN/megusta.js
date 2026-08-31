export const meGustaFamilyModule = {
    category: 'FUN',
    commands: {
        megusta: {
            name: 'megusta',
            alias: ['gustar', 'familiafun'],
            desc: 'Expresa un gusto divertido por un familiar de otro usuario o mencionado.',
            run: async (m, { conn, args }) => {
                const parientesValidos = {
                    mama: ['mamá', 'mama', 'madre'],
                    papa: ['papá', 'papa', 'padre'],
                    hermano: ['hermano', 'hermana', 'hermanos'],
                    tio: ['tío', 'tio', 'tía', 'tia'],
                    abuelo: ['abuelo', 'abuela', 'abuelos']
                };

                const menciones = m.mentionedJid || [];
                let objetivo = menciones.length > 0 ? `@${menciones[0].split('@')[0]}` : null;
                
                let familiarBuscado = null;
                const textoPlano = args.join(' ').toLowerCase();

                for (const [clave, aliases] of Object.entries(parientesValidos)) {
                    if (aliases.some(alias => textoPlano.includes(alias))) {
                        familiarBuscado = clave;
                        break;
                    }
                }

                if (!familiarBuscado) {
                    return m.reply(
                        `😏 *¿A quién estás buscando?*\n\n` +
                        `Debes mencionar a un pariente válido:\n` +
                        `• mamá / madre\n` +
                        `• papá / padre\n` +
                        `• hermano / hermana\n` +
                        `• tío / tía\n` +
                        `• abuelo / abuela\n\n` +
                        `*Ejemplo:* \`.megusta tu mamá @usuario\``
                    );
                }

                if (!objetivo) {
                    objetivo = 'alguien del grupo';
                }

                const frases = {
                    mama: [
                        `👀 Oye ${objetivo}, me han dicho que tu mamá cocina increíble... ¿cuándo me invitas a comer? 🍲`,
                        `😳 No es por nada ${objetivo}, pero tu mamá tiene unas tetas deliciosas me pasas su número? ✨`,
                        `😏 ${objetivo}, tu mamá se ve muy genial, ¡dile que le mando saludos!`
                    ],
                    papa: [
                        `🕶️ Oye ${objetivo}, tu papá se ve que es el tipazo del siglo. 🤝`,
                        `💪 ${objetivo}, tu papá tiene vibra de que resuelve cualquier problema en 5 minutos.`,
                        `👀 Dice la leyenda que el papá de ${objetivo} es el verdadero jefe aquí.`
                    ],
                    hermano: [
                        `🤪 Oye ${objetivo}, tu hermano/a se ve que aguanta el trolleo mejor que tú.`,
                        `🤝 Dile a tu hermano/a que se una al chat ${objetivo}, seguro cae mejor. 👀`
                    ],
                    tio: [
                        `🍻 ${objetivo}, tu tío tiene toda la pinga dura reimel checa eso.`,
                        `😂 Saludos al tío de ${objetivo}, seguro lo toca toda la noche.`
                    ],
                    abuelo: [
                        `👑 El abuelo/a de ${objetivo} es una leyenda viviente. Máximo respeto. 👵👴`,
                        `📜 ${objetivo}, tu abuelo/a tiene más sabiduría en un dedo que todo este grupo junto.`
                    ]
                };

                const listaFrases = frases[familiarBuscado];
                const fraseFinal = listaFrases[Math.floor(Math.random() * listaFrases.length)];

                return conn.sendMessage(m.chat, {
                    text: fraseFinal,
                    mentions: menciones
                }, { quoted: m });
            }
        }
    }
};
