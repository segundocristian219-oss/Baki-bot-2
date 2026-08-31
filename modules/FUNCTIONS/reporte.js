import { jidNormalizedUser } from '@whiskeysockets/baileys';

async function esReporteRelevante(text) {
    const palabrasProhibidas = ['hola', 'xd', 'jaja', 'como estas', 'ayudaaaa', 'test'];
    const textoNormalizado = text.toLowerCase();
    
    if (text.length < 15) return false;
    if (palabrasProhibidas.some(palabra => textoNormalizado.includes(palabra))) return false;
    
    return true;
}

export const reportCommand = {
    category: 'main',
    commands: {
        reporte: {
            name: 'reporte',
            alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
            run: async (m, { conn, text, command, isROwner }) => {
                if (['responder', 'reply', 'r'].includes(command)) {
                    if (!isROwner) return m.reply('Solo desarrolladores.');
                    if (!m.quoted) return m.reply('⚠ Etiqueta el reporte para responder.');

                    const quotedContent = m.quoted.text || m.quoted.caption || '';
                    if (!quotedContent.includes('「 NUEVO REPORTE RECIBIDO 」')) return m.reply('⚠ No es un reporte válido.');

                    try {
                        const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                        const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];
                        const msgId = quotedContent.split('◈ MSG ID: ')[1]?.split('\n')[0];
                        const botJid = quotedContent.split('🤖 Bot JID: ')[1]?.split('\n')[0]; 

                        if (!userJid || !chatId) return m.reply('⚠ Datos de destino ilegibles.');

                        let q = m;
                        let mime = (q.msg || q).mimetype || '';
                        const header = `⌬ RESPUESTA DEL DESARROLLADOR\n\n`;
                        const body = text || '';
                        let content = { text: header + body, mentions: [userJid] };

                        if (/image|video/.test(mime)) {
                            content = { [mime.split('/')[0]]: await q.download(), caption: header + body, mentions: [userJid] };
                        }

                        let targetConn = conn; 
                        const currentBotId = conn.user.id.split(':')[0];
                        const targetBotId = botJid ? botJid.split(':')[0] : null;

                        if (targetBotId && targetBotId !== currentBotId) {
                            const allConns = Array.from(global.conns.values());
                            const subBot = allConns.find(c => c.user && (c.user.id.split(':')[0] === targetBotId));
                            if (subBot) {
                                targetConn = subBot;
                            } else {
                                return m.reply('☒ El sub-bot que recibió este reporte no está activo actualmente.');
                            }
                        }

                        await targetConn.sendMessage(chatId, content, { 
                            quoted: { 
                                key: { remoteJid: chatId, fromMe: false, id: msgId, participant: userJid }, 
                                message: { conversation: quotedContent.split('⊛ Mensaje: ')[1]?.split('\n')[0] || "Reporte" } 
                            } 
                        });

                        return await m.reply(`✓ Respuesta enviada vía ${targetConn.isSub ? 'Sub-Bot' : 'Principal'}.`);
                    } catch (e) {
                        return m.reply('☒ Error: ' + e.message);
                    }
                }

                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';
                let reportText = (text || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '')).trim();

                if (!reportText || reportText.length === 0) return m.reply('⚠ El reporte no puede estar vacío.');

                const esValido = await esReporteRelevante(reportText);
                if (!esValido) {
                    return m.reply('⚠ Reporte rechazado: El contenido parece irrelevante o es spam.');
                }

                try {
                    let mediaBuffer = null;
                    if (mime && /image|video/.test(mime)) {
                        mediaBuffer = await q.download();
                    }

                    const developers = Array.isArray(global.dev1) ? global.dev1 : [global.dev1];

                    const reportMsg = `「 NUEVO REPORTE RECIBIDO 」\n\n` +
                                      `⊛ Tipo: ${command.toUpperCase()}\n` +
                                      `⊛ Usuario: @${m.sender.split('@')[0]}\n` +
                                      `⊛ Nombre: ${m.pushName || 'Usuario'}\n` +
                                      `⌬ Chat ID: ${m.chat}\n` +
                                      `◈ MSG ID: ${m.key.id}\n` +
                                      `🤖 Bot JID: ${conn.user.id}\n` +
                                      `⊛ Mensaje: ${reportText}`;

                    for (const devNumber of developers) {
                        const rawId = devNumber.includes('@') ? devNumber : `${devNumber}@s.whatsapp.net`;
                        const jidDev = jidNormalizedUser(rawId);
                        
                        if (mediaBuffer) {
                            await conn.sendMessage(jidDev, { [mime.split('/')[0]]: mediaBuffer, caption: reportMsg, mentions: [m.sender] });
                        } else {
                            await conn.sendMessage(jidDev, { text: reportMsg, mentions: [m.sender] });
                        }
                    }

                    await m.reply('✓ Reporte enviado al Centro de Control.');
                } catch (err) {
                    await m.reply('☒ Error: ' + err.message);
                }
            }
        }
    }
};
