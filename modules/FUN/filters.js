import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

const FILTER_MAP = {
    blue: "https://api.some-random-api.com/canvas/filter/blue?avatar=",
    blurple: "https://api.some-random-api.com/canvas/filter/blurple?avatar=",
    pixelate: "https://api.some-random-api.com/canvas/filter/pixelate?avatar=",
    blur: "https://api.some-random-api.com/canvas/filter/blur?avatar=",
    blurple2: "https://api.some-random-api.com/canvas/filter/blurple2?avatar=",
    invert: "https://api.some-random-api.com/canvas/filter/invert?avatar=",
    greyscale: "https://api.some-random-api.com/canvas/filter/greyscale?avatar=",
    green: "https://api.some-random-api.com/canvas/filter/green?avatar=",
    blurple2_color: "https://api.some-random-api.com/canvas/filter/blurple2?color=FF4FF4&avatar=",
    blurple2_bright: "https://api.some-random-api.com/canvas/filter/blurple2?brightness=75&avatar=",
    threshold: "https://api.some-random-api.com/canvas/filter/threshold?threshold=75&avatar=",
    sepia: "https://api.some-random-api.com/canvas/filter/sepia?avatar=",
    red: "https://api.some-random-api.com/canvas/filter/red?avatar=",
    invertgreyscale: "https://api.some-random-api.com/canvas/filter/invertgreyscale?avatar="
};

export const imageFilterCommand = {
    category: 'tools',
    commands: {
        filter: {
            name: 'filter',
            alias: ['filtro', 'imgfilter'],
            run: async (m, { conn, command, args, usedPrefix }) => {
                let availableStyles = Object.keys(FILTER_MAP);
                let inputParam = args[0] ? args[0].toLowerCase() : null;
                let selectedFilter = null;

                if (inputParam) {
                    if (!isNaN(inputParam)) {
                        let index = parseInt(inputParam) - 1;
                        if (index >= 0 && index < availableStyles.length) {
                            selectedFilter = availableStyles[index];
                        }
                    } else if (FILTER_MAP[inputParam]) {
                        selectedFilter = inputParam;
                    }
                }

                if (!selectedFilter) {
                    let menu = `🎨 *MENÚ DE ESTILOS DE FILTROS*\n\n`;
                    menu += `Uso: *${usedPrefix + command} <número o nombre>*\n`;
                    menu += `_Responde a una imagen con el comando_\n\n`;
                    menu += `📋 *Estilos Disponibles:*\n`;
                    availableStyles.forEach((style, index) => {
                        menu += `• *${index + 1}.* ${style}\n`;
                    });
                    menu += `\n> *Ejemplo:* ${usedPrefix + command} 3 o ${usedPrefix + command} sepia`;
                    return m.reply(menu);
                }

                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';

                if (!mime || !mime.startsWith('image/')) {
                    return m.reply(`> ⚔ Debes responder o enviar una *imagen* para aplicar el filtro *${selectedFilter}*.`);
                }

                await m.react('⏳');

                try {
                    let buffer = await q.download();
                    if (!buffer) return m.reply("> ⚔ Error al obtener la imagen del mensaje.");

                    const type = await fileTypeFromBuffer(buffer);
                    const fileName = `img_${Date.now()}.${type?.ext || 'jpg'}`;

                    const formData = new FormData();
                    const blob = new Blob([buffer], { type: mime });
                    formData.append('file', blob, fileName);

                    const uploadRes = await fetch('https://cdn.dix.lat/upload/tmp?ttl=60', {
                        method: 'POST',
                        body: formData,
                        headers: { 'User-Agent': 'Drive-Client-Temp' }
                    });

                    const uploadJson = await uploadRes.json();
                    if (!uploadJson.status || !uploadJson.data || !uploadJson.data.url) {
                        await m.react('❌');
                        return m.reply("> ⚔ Error al subir la imagen al CDN temporal.");
                    }

                    const tempImageUrl = uploadJson.data.url;
                    const apiFilterUrl = `${FILTER_MAP[selectedFilter]}${encodeURIComponent(tempImageUrl)}`;

                    const filterRes = await fetch(apiFilterUrl);
                    if (!filterRes.ok) {
                        await m.react('❌');
                        return m.reply(`> ⚔ Error al procesar el filtro en la API (${filterRes.status}).`);
                    }

                    const resultBuffer = await filterRes.buffer();

                    await conn.sendMessage(m.chat, {
                        image: resultBuffer,
                        caption: `🎨 *Filtro aplicado:* ${selectedFilter}`
                    }, { quoted: m });

                    await m.react('✅');

                } catch (e) {
                    console.error('Error en filtro de imagen:', e);
                    await m.react('❌');
                    m.reply(`> ⚔ *Error Crítico:* ${e.message}`);
                }
            }
        }
    }
};
