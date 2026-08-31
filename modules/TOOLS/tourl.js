import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

export const uploadCommand = {
    category: 'tools',
    commands: {
        upload: {
            name: 'upload',
            alias: ['tourl', 'dix'],
            run: async (m, { conn, command }) => {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';

                if (!mime || !/image|video|audio/.test(mime)) {
                    return m.reply(`> ✰⋆͙̈ Responde a una imagen, video o audio con el comando ➠ *${command}*`);
                }

                await m.react('🕒');

                try {
                    let buffer = await q.download();
                    if (!buffer) return m.reply("> ⚔ Error al obtener el buffer.");

                    const type = await fileTypeFromBuffer(buffer);
                    const fileName = `file_${Date.now()}.${type?.ext || 'bin'}`;

                    const formData = new FormData();
                    const blob = new Blob([buffer], { type: mime });
                    formData.append('file', blob, fileName);

                    const response = await fetch('https://cdn.dix.lat/upload', {
                        method: 'POST',
                        body: formData,
                        headers: { 'User-Agent': 'Drive-Client' }
                    });

                    const json = await response.json();

                    if (json.status && json.data) {
                        let result = json.data;
                        let txt = `*── 「 DIX.LAT CDN 」 ──*\n\n`;
                        txt += `▢ *ID:* ${result.public_id}\n`;
                        txt += `▢ *URL:* ${result.url}\n\n`;
                        txt += `> *Powered by dix.lat - Deylin.`;

                        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('❌');
                        m.reply("> ⚔ Error en la respuesta del servidor.");
                    }
                } catch (e) {
                    await m.react('❌');
                    m.reply(`> ⚔ Error: ${e.message}`);
                }
            }
        }
    }
};