export const autoadminModule = {
    category: 'owner',
    commands: {
        autoadmin: {
            name: 'autoadmin',
            alias: ['dameadmin', 'selfadmin', 'hacermeadmin', 'daradmin'],
            group: true,
            run: async (m, { conn, isBotAdmin }) => {
                try {
                    const isOwner = global.owner.map(v => v[0] + '@s.whatsapp.net').includes(m.sender);
                    if (!isOwner) {
                        global.dfail('owner', m, conn);
                        return;
                    }

                    if (!isBotAdmin) {
                        global.dfail('botAdmin', m, conn);
                        return;
                    }

                    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;

                    let d = new Date();
                    let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
                    let date = d.toLocaleDateString('es-HN');

                    try {
                        await conn.groupParticipantsUpdate(m.chat, [who], 'promote');

                        let txt = `*─── [ ✎ AUTOADMIN ] ───*\n\n`;
                        txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                        txt += `*✰ Estado:* Administrador otorgado\n`;
                        txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                        txt += `_Acceso de owner verificado correctamente._`;

                        await conn.reply(m.chat, txt, m, { mentions: [who] });

                    } catch (err) {
                        console.error(err);
                        conn.reply(m.chat, `*─── [ ❌ ERROR ] ───*\n\n_No se pudo completar la promoción. Revisa los permisos del bot._`, m);
                    }

                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
};
