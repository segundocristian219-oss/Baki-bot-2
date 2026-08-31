import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

export const tmpUploadCommand = {
    category: 'tools',
    commands: {
        tmp: {
            name: 'tmp',
            alias: ['temporal', 'tmptime'],
            run: async (m, { conn, command, args }) => {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';

                if (!mime) {
                    return m.reply(`> ✰⋆͙̈ Responde a un archivo para subirlo de forma temporal con ➠ *${command}*`);
                }

                await m.react('🕒');

                try {
                    let buffer = await q.download();
                    if (!buffer) return m.reply("> ⚔ Error al obtener el archivo del mensaje.");

                    const type = await fileTypeFromBuffer(buffer);
                    const fileName = `tmp_${Date.now()}.${type?.ext || 'bin'}`;

                    let ttl = args[0] ? parseInt(args[0]) : 86400; 
                    if (isNaN(ttl)) ttl = 86400;

                    const formData = new FormData();
                    const blob = new Blob([buffer], { type: mime });
                    formData.append('file', blob, fileName);

                    const apiUrl = `https://cdn.dix.lat/upload/tmp?ttl=${ttl}`;

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        body: formData,
                        headers: { 'User-Agent': 'Drive-Client-Temp' }
                    });

                    
                    const responseText = await response.text();
                    let json;

                    try {
                        json = JSON.parse(responseText);
                    } catch (e) {
                        await m.react('❌');
                        return m.reply(`> ⚔ *Error del Servidor (No JSON):*\n> Status: ${response.status}\n> Body: ${responseText.substring(0, 200)}`);
                    }

                    if (json.status && json.data) {
                        let result = json.data;
                        let expDate = new Date(result.expires * 1000).toLocaleString('es-HN');

                        let txt = `*── 「 DIX.LAT TEMPORAL 」 ──*\n\n`;
                        txt += `▢ *ID:* ${result.public_id}\n`;
                        txt += `▢ *EXPIRA:* ${expDate}\n`;
                        txt += `▢ *URL:* ${result.url}\n\n`;
                        txt += `> *Este archivo se eliminará automáticamente.*`;

                        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('❌');
                        m.reply(`> ⚔ *Subida Rechazada por API:*\n> Error: ${json.message || 'Sin mensaje de error'}\n> Status: ${response.status}`);
                    }
                } catch (e) {
                    await m.react('❌');
                    m.reply(`> ⚔ *Error Crítico en el Cliente:*\n> ${e.message}`);
                }
            }
        }
    }
};