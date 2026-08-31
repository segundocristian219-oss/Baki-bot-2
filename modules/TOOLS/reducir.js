import sharp from 'sharp';

export const reduceCommand = {
    category: 'tools',
    commands: {
        reduce: {
            name: 'reduce',
            alias: ['reducir', 'resize'],
            run: async (m, { conn, text }) => {
                if (!m.quoted || !/image|sticker/.test(m.quoted.mtype)) {
                    return conn.sendMessage(m.chat, { text: '> ╰❏ *Responde a una imagen o sticker para redimensionar.*' }, { quoted: m });
                }

                if (!text) {
                    return conn.sendMessage(m.chat, { text: '> ╰❐ *Indique las dimensiones.*\n*Uso: .reduce 300x300*' }, { quoted: m });
                }

                let input = text.trim().split(/[x×]/i);
                if (input.length !== 2 || isNaN(input[0]) || isNaN(input[1])) {
                    return conn.sendMessage(m.chat, { text: '> ⚠ *Formato incorrecto.*\n*Uso: .reduce 300x300*' }, { quoted: m });
                }

                let width = parseInt(input[0]);
                let height = parseInt(input[1]);

                if (width > 2000 || height > 2000) {
                    return conn.sendMessage(m.chat, { text: '> ✧ *Las dimensiones exceden el límite de 2000px.*' }, { quoted: m });
                }

                try {
                    let media = await m.quoted.download();
                    if (!media) return conn.sendMessage(m.chat, { text: '> ⚠️ *No se pudo descargar el archivo.*' }, { quoted: m });

                    
                    const buffer = await sharp(media)
                        .resize(width, height, {
                            fit: 'fill' 
                        })
                        .toFormat('jpeg')
                        .toBuffer();

                    await conn.sendMessage(m.chat, { 
                        image: buffer, 
                        caption: `> ⌬ *Imagen procesada a ${width}x${height}*` 
                    }, { quoted: m });
                } catch (e) {
                    console.error(e);
                    return conn.sendMessage(m.chat, { text: `> ⚠️ *ERROR:* ${e.message || e}` }, { quoted: m });
                }
            }
        }
    }
};