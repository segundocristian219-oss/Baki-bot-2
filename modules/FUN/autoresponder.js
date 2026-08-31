export const autoResponderModule = {
    commands: {
        autoresponder_pro: {
            name: 'autoresponder',
            alias: [],
            async before(m, { conn, chat, channelInfo }) {
                try {
                    if (!m.isGroup || !chat?.autoresponder) return false;
                    if (m.isBaileys || m.fromMe) return false;

                    const rawText = (m.text || '').trim();
                    if (!rawText) return false;

                    const text = rawText.toLowerCase();

                    const activePrefixes = ['.', '#', '/', '!'];
                    if (activePrefixes.some(p => text.startsWith(p))) return false;

                    const botJid = conn.decodeJid(conn.user?.id || '');
                    const botLid = conn.decodeJid(conn.user?.lid || '');

                    const mentions = (m.mentionedJid || []).map(j => conn.decodeJid(j));

                    const isMentioned = (botJid && mentions.includes(botJid)) || (botLid && mentions.includes(botLid));

                    const quotedSender = m.quoted ? conn.decodeJid(m.quoted.sender) : null;
                    const isQuotedBot = quotedSender && (quotedSender === botJid || quotedSender === botLid);

                    const hasBotWord = /\bbot\b/i.test(text);

                    if (!isMentioned && !isQuotedBot && !hasBotWord) return false;

                    const cleanText = rawText.replace(/@\d+/g, '').replace(/\bbot\b/gi, '').trim();
                    const queryText = cleanText.length > 0 ? cleanText : rawText;

                    const normalizedText = queryText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    const response = await fetch('https://dix.lat/v1/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: normalizedText
                        })
                    });

                    if (!response.ok) return false;

                    const data = await response.json();

                    if (data && (data.status === 'success' || data.found === true) && typeof data.reply === 'string' && data.reply.trim() !== '') {
                        const finalText = `${data.reply.trim()}`;

                        await conn.sendPreviewMessage(m.chat, finalText, {
                            type: 3, 
                            ratio: 'landscape',
                            url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                            thumbnail: 'https://cdn.dix.lat/me/msp62mtjf0e588081f42.png',
                            title: name(),
                            body: 'Sistema de Auto-Respuesta',
                            quoted: m
                        }).catch(() => null);

                        return true;
                    }
                } catch (e) {
                    console.error('Error en Autoresponder:', e);
                }
                return false;
            }
        }
    }
};
