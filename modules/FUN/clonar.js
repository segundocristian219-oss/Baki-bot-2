import fetch from 'node-fetch';

const moduleData = {
    fun: {
        category: 'Diversión',
        commands: {
            clonar: {
                name: 'clonar',
                alias: ['fakemsg', 'fakequote', 'falso'],
                desc: 'Crea una captura o mensaje falso usando la foto de perfil de un usuario.',
                run: async (m, { conn }) => {
                    try {
                        let args = m.text.trim().split(/ +/).slice(1);
                        let usuario = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);

                        if (!usuario) {
                            return conn.sendMessage(m.chat, { 
                                text: '⚠️ Debes etiquetar a alguien o responder a su mensaje.\n\n*Uso:* `.clonar @usuario <texto falso>`' 
                            }, { quoted: m });
                        }

                        let texto = args.join(' ').replace(/@\d+/g, '').trim();

                        if (!texto) {
                            return conn.sendMessage(m.chat, { 
                                text: '⚠️ Escribe el mensaje que quieres que diga esa persona.\n\n*Ejemplo:* `.clonar @usuario Confieso que soy un bot.`' 
                            }, { quoted: m });
                        }

                        let ppUrl;
                        try {
                            ppUrl = await conn.profilePictureUrl(usuario, 'image');
                        } catch {
                            ppUrl = 'https://i.imgur.com/2w3P42S.png'; 
                        }

                        let name = usuario.split('@')[0];

                        let obj = {
                            "type": "quote",
                            "format": "png",
                            "backgroundColor": "#1b2029",
                            "width": 512,
                            "height": 768,
                            "scale": 2,
                            "messages": [
                                {
                                    "entities": [],
                                    "avatar": true,
                                    "from": {
                                        "id": 1,
                                        "name": name,
                                        "photo": {
                                            "url": ppUrl
                                        }
                                    },
                                    "text": texto,
                                    "replyMessage": {}
                                }
                            ]
                        };

                        let res = await fetch('https://quote.btch.bz/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(obj)
                        });

                        if (!res.ok) {
                            let fallbackUrl = `https://some-random-api.com/canvas/misc/tweet?displayname=${encodeURIComponent(name)}&username=${encodeURIComponent(name)}&avatar=${encodeURIComponent(ppUrl)}&comment=${encodeURIComponent(texto)}`;
                            return await conn.sendMessage(m.chat, { image: { url: fallbackUrl }, caption: `🤡 *Mensaje falso de @${usuario.split('@')[0]}*`, contextInfo: { mentionedJid: [usuario] } }, { quoted: m });
                        }

                        let json = await res.json();
                        let buffer = Buffer.from(json.result.image, 'base64');

                        await conn.sendMessage(m.chat, { 
                            image: buffer, 
                            caption: `🤡 *Mensaje clonado de @${usuario.split('@')[0]}*`,
                            contextInfo: { mentionedJid: [usuario] }
                        }, { quoted: m });

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error al clonar el mensaje: ${err.message}` }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
