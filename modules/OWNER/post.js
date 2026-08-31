import fetch from 'node-fetch';

export const postModule = {
    category: 'owner',
    commands: {
        post: {
            name: 'post',
            alias: ['curl'],
            run: async (m, { conn, args, isROwner }) => {
                if (!isROwner) return;

                const text = args.join(' ');
                if (!text) return;

                const urlRegex = /https?:\/\/[^\s]+/g;
                const url = text.match(urlRegex)?.[0];

                const bodyMatch = text.match(/-d\s+'({.+})'/);
                let bodyData = null;

                if (bodyMatch) {
                    try {
                        bodyData = JSON.parse(bodyMatch[1]);
                    } catch {
                        bodyData = null;
                    }
                }

                if (!url) return;

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: bodyData ? JSON.stringify(bodyData) : null
                    });

                    const data = await response.json();
                    const output = JSON.stringify(data, null, 2);
                    const finalOutput = output.length > 2000 ? `${output.substring(0, 2000)}\n\n...[Respuesta truncada por tamaño]` : output;

                    await conn.sendMessage(m.chat, { 
                        text: `*Respuesta del Servidor:*\n\n\`\`\`json\n${finalOutput}\n\`\`\`` 
                    }, { quoted: m });

                } catch (e) {
                    await conn.sendMessage(m.chat, { text: `Error: ${e.message}` }, { quoted: m });
                }
            }
        }
    }
};
