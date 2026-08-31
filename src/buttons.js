import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
import axios from 'axios';

export function initButtons(conn) {
    conn.sendButtonMessage = async (jid, text = '', buttons = [], opts = {}) => {
        try {
            const {
                footer = '',
                title = '',
                quoted = null,
                mentions = [],
                sections = [],
                image = null
            } = opts;

            const formattedButtons = buttons.map((btn, index) => {
                if (btn.url) {
                    return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: btn.text || '', url: btn.url, merchant_url: btn.url }) };
                }
                if (btn.phoneNumber) {
                    return { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: btn.text || '', phone_number: btn.phoneNumber }) };
                }
                if (btn.copy) {
                    return { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: btn.text || '', copy_code: btn.copy }) };
                }
                return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btn.text || '', id: btn.id || `btn_${index}` }) };
            });

            if (sections.length > 0) {
                formattedButtons.push({
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Seleccionar',
                        sections: sections.map(s => ({
                            title: s.title,
                            rows: s.rows.map(r => ({ title: r.title, description: r.description || '', id: r.id }))
                        }))
                    })
                });
            }

            let header = {};
            if (image) {
                try {
                    let imageBuffer;
                    if (typeof image === 'string') {
                        const response = await axios.get(image, { responseType: 'arraybuffer' });
                        imageBuffer = Buffer.from(response.data);
                    } else {
                        imageBuffer = image;
                    }
                    const media = await prepareWAMessageMedia({ image: imageBuffer }, { upload: conn.waUploadToServer });
                    header = {
                        hasMediaAttachment: true,
                        imageMessage: media.imageMessage
                    };
                } catch (imgError) {
                    console.error("Error al procesar imagen en botones:", imgError);
                }
            } else if (title) {
                header = { title: String(title).trim(), hasMediaAttachment: false };
            }

            const interactiveMessage = {
                body: { text: String(text).trim() },
                footer: footer ? { text: String(footer).trim() } : undefined,
                header: Object.keys(header).length > 0 ? header : undefined,
                nativeFlowMessage: {
                    buttons: formattedButtons,
                    contentFormatVersion: 1
                },
                contextInfo: {
                    mentionedJid: mentions.length > 0 ? mentions : (typeof conn.parseMention === 'function' ? conn.parseMention(text) : []),
                    groupMentions: []
                }
            };

            const waMsg = generateWAMessageFromContent(jid, { interactiveMessage }, { quoted, userJid: conn.user?.jid || conn.user?.id });

            const additionalNodes = [{
                tag: 'biz',
                attrs: {},
                content: [{
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                }]
            }];

            if (!jid.endsWith('@g.us')) {
                additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
            }

            return await conn.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id, additionalNodes });
        } catch (error) {
            console.error("Error crítico en sendButtonMessage:", error);
            throw error;
        }
    };
}