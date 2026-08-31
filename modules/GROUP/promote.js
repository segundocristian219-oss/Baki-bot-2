import { getRealJid } from '../../core/identifier.js'

export const promoteCommand = {
    category: 'group',
    commands: {
        promote: {
            name: 'promote',
            alias: ['daradmin'],
            group: true,
            botAdmin: true,
            admin: true,
            run: async (m, { conn }) => {
                try {
                    let rawWho = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
                    if (!rawWho) {
                        return conn.sendMessage(m.chat, { text: `> ♛ *_Debes etiquetar a alguien o responder a su mensaje._*` }, { quoted: m });
                    }

                    const who = (await getRealJid(conn, rawWho, m)) || rawWho;
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participants = groupMetadata.participants || [];

                    const targetUser = participants.find(p => p.id === who || p.lid === who || p.id === rawWho || p.lid === rawWho);

                    if (!targetUser) {
                        return conn.sendMessage(m.chat, { text: `> ❌ *_El usuario no se encuentra en el grupo._*` }, { quoted: m });
                    }

                    const isTargetAdmin = targetUser.admin === 'admin' || targetUser.admin === 'superadmin';

                    if (isTargetAdmin) {
                        return conn.sendMessage(m.chat, { 
                            text: `> ✎ *_El usuario @${targetUser.id.split('@')[0]} ya es administrador._*`, 
                            mentions: [targetUser.id] 
                        }, { quoted: m });
                    }

                    let date = new Date().toLocaleDateString('es-HN');
                    await conn.groupParticipantsUpdate(m.chat, [targetUser.id], 'promote');

                    let txt = `*─── [ ♛ PROMOTE ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${targetUser.id.split('@')[0]}\n`;
                    txt += `*✰ Estado:* Nuevo administrador\n`;
                    txt += `*➠ Fecha:* ${date}\n\n`;

                    await conn.sendMessage(m.chat, { text: txt, mentions: [targetUser.id] }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    conn.sendMessage(m.chat, { text: `> ❌ *_Error al promover al usuario._*` }, { quoted: m });
                }
            }
        }
    }
};
