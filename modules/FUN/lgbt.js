import fetch from "node-fetch";

const createFlagsCommand = (cmdName, aliasList, title, endpoint, emoji) => {
    return {
        name: cmdName,
        alias: aliasList,
        run: async (m, { conn }) => {
            const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
            const percent = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
            const userNumber = who.split('@')[0];

            const styles = [
                `🚀 *RESULTADOS DE LA NASA* 🚀\n\nAnalizando a: @${userNumber}\n\nLos satélites confirman un *${percent}%* de nivel ${title}.\n\n¡El universo no miente! ${emoji}`,
                `📊 *ESTADÍSTICAS GLOBALES* 📊\n\nIdentidad confirmada: @${userNumber}\n\nEl mundo ha votado y el veredicto es un imbatible *${percent}%*.\n\n¡Es oficial, no hay duda! ${emoji}`,
                `⚖️ *EL MEDIDOR INVISIBLE* ⚖️\n\nEscaneando a: @${userNumber}\n\n*RESULTADO:* ${percent}%\n*NIVEL:* Altamente detectado.\n\n${emoji} ¡Miren a este usuario! ${emoji}`,
                `🧬 *ANÁLISIS DE ADN* 🧬\n\nSujeto: @${userNumber}\n\nSe ha detectado el gen ${title} activado al *${percent}%*.\n\n¡La ciencia lo confirma! ${emoji}`
            ];

            const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

            try {
                let avatarUrl;
                try {
                    avatarUrl = await conn.profile(who, 'image');
                } catch {
                    const label = encodeURIComponent(`ID: ${userNumber}`);
                    avatarUrl = `https://lucide-api.vercel.app/api/avatar?text=${label}&bg=2c3e50&clr=ffffff&size=500`;
                }

                const processedImageUrl = `${endpoint}${encodeURIComponent(avatarUrl)}`;

                await conn.sendMessage(m.chat, {
                    image: { url: processedImageUrl },
                    caption: selectedStyle,
                    mentions: [who]
                }, { quoted: m });

            } catch (error) {
                await conn.sendMessage(m.chat, { 
                    text: `${emoji} *ANÁLISIS DE IDENTIDAD*\n\nIdentificado: @${userNumber}\nResultado: *${percent}%* ${title}.`, 
                    mentions: [who] 
                }, { quoted: m });
            }
        }
    };
};

export const identityFlagsCommands = {
    category: 'fun',
    commands: {
        bisexual: createFlagsCommand('bisexual', ['bi'], 'Bisexual', 'https://api.some-random-api.com/canvas/misc/bisexual?avatar=', '💖💜💙'),
        mlm: createFlagsCommand('mlm', ['gaymen', 'gay'], 'Gay MLM', 'https://api.some-random-api.com/canvas/misc/mlm?avatar=', '💚🤍💙'),
        lesbian: createFlagsCommand('lesbian', ['lesbiana'], 'Lesbiana', 'https://api.some-random-api.com/canvas/misc/lesbian?avatar=', '🧡🤍💖'),
        lgbt: createFlagsCommand('lgbt', ['rainbow', 'arcoiris'], 'LGBT', 'https://api.some-random-api.com/canvas/misc/lgbt?avatar=', '🏳️‍🌈'),
        nonbinary: createFlagsCommand('nonbinary', ['nobinario', 'nb'], 'No Binario', 'https://api.some-random-api.com/canvas/misc/nonbinary?avatar=', '💛🤍💜🖤'),
        pansexual: createFlagsCommand('pansexual', ['pan'], 'Pansexual', 'https://api.some-random-api.com/canvas/misc/pansexual?avatar=', '💖💛💙'),
        transgender: createFlagsCommand('transgender', ['trans'], 'Transgénero', 'https://api.some-random-api.com/canvas/misc/transgender?avatar=', '🩵🩷🤍🩷🩵')
    }
};
