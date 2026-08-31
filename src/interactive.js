import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';

export function initInteractive(conn) {
    conn.sendInteractiveMsg = async (jid, text = '', suggestions = [], opts = {}) => {
        const { quoted = null, mentions = [] } = opts;
        const isGroup = jid.endsWith('@g.us');

        const contextInfo = {
            mentionedJid: mentions,
            ...(quoted ? { participant: quoted.sender || quoted.key.remoteJid, quotedMessage: quoted.message } : {})
        };

        const formatButton = (b) => {
            if (typeof b !== 'object' || b === null) return null;
            return {
                name: b.name || 'quick_reply',
                buttonParamsJson: typeof b.buttonParamsJson === 'string' 
                    ? b.buttonParamsJson 
                    : JSON.stringify(b.buttonParamsJson || b)
            };
        };

        const buttons = suggestions.map(formatButton).filter(Boolean);

        let interactiveMessage = {};

        if (opts.cards && Array.isArray(opts.cards)) {
            const cards = [];
            for (let i = 0; i < opts.cards.length; i++) {
                const card = opts.cards[i];
                let header = { hasMediaAttachment: false };

                if (card.image || card.video) {
                    const media = await prepareWAMessageMedia(
                        card.image ? { image: typeof card.image === 'string' ? { url: card.image } : card.image } : { video: typeof card.video === 'string' ? { url: card.video } : card.video },
                        { upload: conn.waUploadToServer }
                    );
                    header = {
                        [card.image ? 'imageMessage' : 'videoMessage']: card.image ? media.imageMessage : media.videoMessage,
                        title: card.title || '',
                        hasMediaAttachment: true
                    };
                } else {
                    header = { title: card.title || '', hasMediaAttachment: false };
                }

                const cardButtons = (card.buttons || []).map(formatButton).filter(Boolean);

                cards.push({
                    header,
                    body: { text: card.body || '' },
                    footer: { text: card.footer || '' },
                    nativeFlowMessage: { 
                        buttons: cardButtons,
                        messageParamsJson: card.messageParamsJson ? (typeof card.messageParamsJson === 'string' ? card.messageParamsJson : JSON.stringify(card.messageParamsJson)) : undefined
                    }
                });
            }

            interactiveMessage = {
                body: { text: text || '' },
                footer: { text: opts.footer || 'RyZe Codes' },
                contextInfo,
                carouselMessage: { cards: cards, messageVersion: 1 }
            };
        } else {
            let header = { hasMediaAttachment: false };
            if (opts.image || opts.video || opts.document) {
                const media = await prepareWAMessageMedia(
                    opts.image ? { image: typeof opts.image === 'string' ? { url: opts.image } : opts.image } : 
                    opts.video ? { video: typeof opts.video === 'string' ? { url: opts.video } : opts.video } : 
                    { document: opts.document },
                    { upload: conn.waUploadToServer }
                );
                header = {
                    [opts.image ? 'imageMessage' : opts.video ? 'videoMessage' : 'documentMessage']: opts.image ? media.imageMessage : opts.video ? media.videoMessage : media.documentMessage,
                    title: opts.title || '',
                    hasMediaAttachment: true
                };
            } else {
                header = { title: opts.title || '', hasMediaAttachment: false };
            }

            interactiveMessage = {
                header,
                body: { text: text || '' },
                footer: { text: opts.footer || 'RyZe Codes' },
                contextInfo,
                nativeFlowMessage: { 
                    buttons: buttons,
                    messageParamsJson: opts.messageParamsJson ? (typeof opts.messageParamsJson === 'string' ? opts.messageParamsJson : JSON.stringify(opts.messageParamsJson)) : undefined
                }
            };
        }

        const message = { viewOnceMessage: { message: { interactiveMessage } } };
        const waMsg = generateWAMessageFromContent(jid, message, { quoted, userJid: conn.user?.jid || conn.user?.id });

        const flowName = opts.flowName || 'data_exchange';
        const flowVersion = opts.flowVersion || '3';

        const additionalNodes = [
            { tag: 'biz', attrs: {}, content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: flowVersion, name: flowName } }] }] }
        ];
        if (!isGroup) additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });

        await conn.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id, additionalNodes: additionalNodes });
        return waMsg;
    };
}
