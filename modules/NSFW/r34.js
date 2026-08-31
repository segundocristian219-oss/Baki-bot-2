import fetch from 'node-fetch';

export const nsfwRuleCommand = {
    category: 'nsfw',
    commands: {
        r34: {
            name: 'r34',
            alias: ['rule34', 'rule'],
            nsfw: true,
            run: async (m, { conn, text, usedPrefix, command }) => {
                try {
                    if (!text) return conn.reply(m.chat, `《✧》 Debes especificar tags para buscar\n> Ejemplo » *${usedPrefix + command} neko*`, m);      

                    await m.react('🕒');

                    const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(text)}&user_id=5267539&api_key=dc12e2cb36b1bab5e941e7024bd2ac35dcdc9285bc047a4c99921bbfbc8ce5320b7f874de7e7e9ac23781ff9414f2cea88cb2e2cda77bfc36975576dc0fede0a`

                    const res = await fetch(url, { 
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } 
                    });

                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                    const body = await res.text();
                    if (!body || body.trim().length === 0) {
                        await m.react('✖️');
                        return conn.reply(m.chat, `《✧》 El servidor devolvió una respuesta vacía. Intenta de nuevo.`, m);
                    }

                    let json;
                    try {
                        json = JSON.parse(body);
                    } catch (parseError) {
                        await m.react('✖️');
                        return conn.reply(m.chat, `> ⚠️ Error al procesar datos del servidor. (Respuesta no válida)`, m);
                    }

                    if (!Array.isArray(json) || json.length === 0) {
                        await m.react('✖️');
                        return conn.reply(m.chat, `《✧》 No se encontraron resultados para: ${text}`, m);
                    }

                    const target = json[Math.floor(Math.random() * json.length)];
                    const media = target.file_url || target.sample_url;
                    if (!media) throw new Error('No se encontró URL de archivo en el resultado.');

                    const caption = `*─── [ 🔞 RULE34 ] ───*\n\n` +
                                    `*✰ Búsqueda:* ${text}\n` +
                                    `*➠ Tags:* ${target.tags || 'Sin tags'}\n\n` +
                                    `_Resultado verificado correctamente._`;

                    const isVideo = media.toLowerCase().endsWith('.mp4') || media.toLowerCase().endsWith('.webm');

                    await conn.sendMessage(m.chat, { 
                        [isVideo ? 'video' : 'image']: { url: media }, 
                        caption, 
                        mentions: [m.sender] 
                    }, { quoted: m });

                    await m.react('✔️');

                } catch (e) {
                    await m.react('✖️');
                    await m.reply(`> [Error Crítico: *${e.message}*]`);
                }
            }
        }
    }
};
