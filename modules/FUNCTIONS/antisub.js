export const antisubCommand = {
    category: 'group',
    commands: {
        antisub: {
            name: 'antisub',
            alias: ['antisubs'],
            admin: true,
            group: true,
            run: async (m, { text, conn }) => {
                if (!text) return conn.reply(m.chat, `*¿Estado del filtro?*\nUso: .antisub on / off`, m);

                const input = text.toLowerCase();
                let status;

                if (input === 'on') status = true;
                else if (input === 'off') status = false;
                else return conn.reply(m.chat, `*Opción no válida.*\nUse: .antisub on / off`, m);

                await global.Chat.findOneAndUpdate(
                    { id: m.chat },
                    { $set: { antisub: status } },
                    { upsert: true }
                );

                const message = status 
                    ? `*「 ANTISUB ACTIVADO 」*\n\nSolo el bot principal responderá en este grupo.`
                    : `*「 ANTISUB DESACTIVADO 」*\n\nTodos los bots responderán en este grupo.`;

                await conn.reply(m.chat, message, m);
            }
        }
    }
};
