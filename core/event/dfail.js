export const dfail = async (type, m, conn) => {
    const messages = {
        rowner: `> ❒ Solo mi creador puede usar este comando.`,
        owner: `> ❒ Solo mi creador puede usar este comando.`,
        group: `> ✎ Este comando sólo se puede usar en grupos.`,
        private: `De esto solo hablo en privado.`,
        admin: `> ♛ Sólo los administradores pueden ejecutar este comando.`,
        nsfw: `> ❒ El contenido NSFW está desactivado.`,
        botAdmin: `> ✰ Necesito ser administrador.`,
        self: `『 ✖ 』 Comando exclusivo para el host de la cuenta.`,
        isPrem: `> ❒ *Acceso Restringido*\n\n> Este comando es exclusivo para los bots con suscripción Premium.`
    };
    if (messages[type] && m.chat) {
        await conn.sendPreviewMessage(m.chat, messages[type], {
            type: 3, 
            ratio: 'landscape',
            url: global.surl(conn),
            thumbnail: img(conn),
            title: name(conn),
            body: `CREADOR: hrz`,
            quoted: m,
            contextInfo: {
                ...channelInfo
            }
        }).catch(() => null);
    }
};
