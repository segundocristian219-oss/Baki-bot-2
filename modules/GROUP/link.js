import axios from 'axios';
import sharp from 'sharp';
import fetch from 'node-fetch';

const getBotName = (conn) => (typeof name === 'function' ? name(conn) : (conn?.user?.name || 'Bot'));
const getBotImg = (conn) => (typeof img === 'function' ? img(conn) : null);
const getDeveloperName = () => (typeof developer !== 'undefined' ? developer : 'Developer');

async function getOptimizedThumbnail(source) {
    if (!source) return Buffer.alloc(0);
    try {
        let inputBuffer;
        if (Buffer.isBuffer(source)) {
            inputBuffer = source;
        } else if (typeof source === 'string' && source.startsWith('http')) {
            const res = await fetch(source);
            if (!res.ok) return Buffer.alloc(0);
            const arrayBuffer = await res.arrayBuffer();
            inputBuffer = Buffer.from(arrayBuffer);
        } else {
            return Buffer.alloc(0);
        }

        const resizedBuffer = await sharp(inputBuffer)
            .resize(300, 220, { fit: 'cover' })
            .toFormat('jpeg', { quality: 70 })
            .toBuffer();

        return resizedBuffer;
    } catch (e) {
        return Buffer.alloc(0);
    }
}

export const linkCommand = {
    category: 'group',
    commands: {
        link: {
            name: 'link',
            alias: ['enlace', 'link'],
            group: true,
            botAdmin: true,
            run: async (m, { conn }) => {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const inviteCode = await conn.groupInviteCode(m.chat);
                    const mainLink = `https://chat.whatsapp.com/${inviteCode}`;

                    let shortLink;
                    try {
                        const { data } = await axios.post('https://dix.lat/short?', {
                            url: mainLink
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });

                        shortLink = data.status ? data.url : 'No disponible';
                    } catch (error) {
                        console.error('Error al acortar:', error);
                        shortLink = 'Error en el servicio';
                    }

                    const caption = `*─── 「 ENLACE DE GRUPO 」 ───*\n\n▢ *GRUPO:* ${groupMetadata.subject}\n▢ *MIEMBROS:* ${groupMetadata.participants.length}\n\n▢ *ENLACE PRINCIPAL:*\n• ${mainLink}\n\n▢ *ENLACE CORTO:*\n• ${shortLink}\n\n*──────────────────────────*`.trim();

                    let rawBotImg = getBotImg(conn);
                    let thumbnailBuffer = await getOptimizedThumbnail(rawBotImg);

                    const rawPayload = {
                        buttonsMessage: {
                            contentText: getBotName(conn),
                            footerText: caption,
                            headerType: 6,
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                url: typeof global.surl === 'function' ? global.surl(conn) : 'https://whatsapp.com',
                                name: groupMetadata.subject || getBotName(conn),
                                address: getDeveloperName(),
                                jpegThumbnail: thumbnailBuffer
                            },
                            contextInfo: {
                                
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardOrigin: "UNKNOWN",
                                mentionedJid: [m.sender]
                            }
                        }
                    };

                    await conn.relayMessage(m.chat, rawPayload, { quoted: m });
                } catch (e) {
                    console.error('Error en el comando link:', e);
                }
            }
        }
    }
};
