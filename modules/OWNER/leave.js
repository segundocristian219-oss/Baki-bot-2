export const leaveModule = {
    category: 'owner',
    commands: {
        salir: {
            name: 'salir',
            alias: ['leavegc', 'salirdelgrupo', 'leave'],
            run: async (m, { conn, text, isROwner }) => {
                try {
                    if (!isROwner) return;
                    let id = text ? text.trim() : m.chat;

                    if (!id.endsWith('@g.us')) {
                        return m.reply('❌ El ID proporcionado no es un grupo válido.');
                    }

                    await m.react('👋');

                    await conn.sendMessage(id, { 
                        text: `👋 *Me despido de este grupo.*` 
                    });

                    await conn.groupLeave(id);

                } catch (error) {
                    console.error(error);
                    m.reply('❌ Ocurrió un error al intentar salir del grupo.');
                }
            }
        }
    }
};
