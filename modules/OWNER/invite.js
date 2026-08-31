const inviteRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;

export const Invite = {
    category: 'owner',
    commands: {
        invite: {
            name: 'invite',
            alias: ['invitelink', 'unirme'],
            owner: true,
            run: async function (m, { conn, args, text, chat, usedPrefix, command }) {
                const targetChat = chat || m.chat;
                const input = (text || args[0] || '').trim();

                if (!input) {
                    return conn.sendMessage(targetChat, {
                        text: `✳️ Uso correcto:\n${usedPrefix + command} <enlace del grupo>\n\nEjemplo:\n${usedPrefix + command} https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX`
                    }, { quoted: m });
                }

                const match = input.match(inviteRegex);

                if (!match) {
                    return conn.sendMessage(targetChat, {
                        text: '❌ El enlace proporcionado no es válido. Verifica que sea un enlace de invitación de WhatsApp.'
                    }, { quoted: m });
                }

                const inviteCode = match[1];

                try {
                    const groupInfo = await conn.groupGetInviteInfo(inviteCode);

                    await conn.sendMessage(targetChat, {
                        text: `⏳ Uniéndome al grupo *${groupInfo.subject}*...`
                    }, { quoted: m });

                    await conn.groupAcceptInvite(inviteCode);

                    await conn.sendMessage(targetChat, {
                        text: `✅ Me uní correctamente al grupo *${groupInfo.subject}*.`
                    }, { quoted: m });
                } catch (error) {
                    const errorText = String(error?.message || error);
                    let respuesta = `❌ No se pudo unir al grupo.\n\nMotivo: ${errorText}`;

                    if (errorText.includes('account_reachout_restricted')) {
                        respuesta = '⚠️ WhatsApp restringió esta acción (account_reachout_restricted).\n\nEsto ocurre por políticas anti-spam cuando la cuenta es nueva o alcanzó el límite de enlaces aceptados.\n\nSolución: agrega al bot manualmente al grupo o espera de 24 a 72 horas antes de reintentar.';
                    } else if (errorText.includes('410')) {
                        respuesta = '❌ El enlace de invitación ya no es válido o expiró.';
                    } else if (errorText.includes('401')) {
                        respuesta = '❌ No tienes autorización para unirte a este grupo (posible baneo previo del bot).';
                    } else if (errorText.includes('404')) {
                        respuesta = '❌ El grupo no existe o el enlace fue revocado.';
                    }

                    return conn.sendMessage(targetChat, { text: respuesta }, { quoted: m });
                }
            }
        }
    }
};
