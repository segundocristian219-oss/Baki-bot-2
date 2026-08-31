import fetch from "node-fetch";

function formatToWhatsApp(text) {
    if (!text) return '';
    return text
        .replace(/^#{1,6}\s+(.+)$/gm, '*$1*')
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        .replace(/^\s*[\-\*]\s+/gm, '• ');
}

export const chatgptCommand = {
    category: 'ai',
    commands: {
        chatgpt: {
            name: 'gemini',
            alias: ['ia'],
            run: async (m, { conn, text }) => {
                if (!text && !m.quoted) {
                    return await conn.sendMessage(m.chat, { 
                        text: `> ⌗ Hola, ¿En qué puedo ayudarte hoy?` 
                    }, { quoted: m });
                }

                await m.react('⏳');

                try {
                    const prompt = text || (m.quoted ? m.quoted.text : "Hola");
                    const vokerRes = await fetch(`https://fix.dix.lat/api/gemini?text=${encodeURIComponent(prompt)}`);
                    const vokerJson = await vokerRes.json();
                    const respuestaRaw = vokerJson.response || vokerJson.result || vokerJson.data;

                    if (!respuestaRaw) throw new Error("La API dix.lat no devolvió respuesta.");

                    const mensajeFormateado = formatToWhatsApp(respuestaRaw);
                    const thumbnail = 'https://cdn.dix.lat/me/540c616d-4648-4f54-99ab-10fe38e54b1b.png';
                    const channelInfo = global.channelInfo || {};

                    await m.react('✅');

                    await conn.sendPreviewMessage(m.chat, mensajeFormateado, {
                        type: 3, 
                        ratio: 'landscape',
                        url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: thumbnail,
                        title: 'Gemini AI Network',
                        body: 'CATEGORÍA: Inteligencia Artificial',
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo,
                            mentionedJid: [m.sender]
                        }
                    });

                } catch (e) {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, { 
                        text: `> ⚔ ERROR: No se pudo procesar la solicitud en este momento.` 
                    }, { quoted: m });
                }
            }
        }
    }
};
