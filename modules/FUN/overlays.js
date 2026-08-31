import fetch from "node-fetch";

const createCanvasOverlayCommand = (cmdName, aliasList, title, endpoint, stylesList) => {
    return {
        name: cmdName,
        alias: aliasList,
        run: async (m, { conn }) => {
            const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
            const userNumber = who.split('@')[0];
            const selectedStyle = stylesList[Math.floor(Math.random() * stylesList.length)].replace(/\{user\}/g, `@${userNumber}`);

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
                    text: `❌ *Error al procesar el efecto para {user}*`.replace('{user}', `@${userNumber}`), 
                    mentions: [who] 
                }, { quoted: m });
            }
        }
    };
};

export const miscOverlayCommands = {
    category: 'fun',
    commands: {
        heart: createCanvasOverlayCommand(
            'heart', 
            ['corazon', 'love'], 
            'Corazón', 
            'https://api.some-random-api.com/canvas/misc/heart?avatar=', 
            [
                `💖 *¡MUCHO AMOR!* 💖\n\nSujeto encojonado de amor: {user}\n\n¡El corazón no miente! 💕`,
                `🥰 *DIAGNÓSTICO ENAMORADO* 🥰\n\nAnalizando los latidos de {user}...\n\n¡Nivel de amor por los cielos! ❤️`,
                `💌 *SISTEMA DE AFECTO* 💌\n\n{user} ha recibido un disparo directo al corazón. 💘`
            ]
        ),
        jail: createCanvasOverlayCommand(
            'jail', 
            ['carcel', 'prision', 'preso'], 
            'Cárcel', 
            'https://api.some-random-api.com/canvas/overlay/jail?avatar=', 
            [
                `🚨 *¡ARRESTADO!* 🚨\n\nDetenido: {user}\n\n*MOTIVO:* Exceso de fachas y crímenes contra el servidor. ⛓️`,
                `⚖️ *ORDEN DE APREHENSIÓN* ⚖️\n\nLa policía del bot ha capturado a {user}.\n\n¡A las celdas sin derecho a fianza! 🚔`,
                `⛓️ *TRAS LAS REJAS* ⛓️\n\nEl usuario {user} estará encerrado por un buen tiempo. 👮‍♂️`
            ]
        )
    }
};
