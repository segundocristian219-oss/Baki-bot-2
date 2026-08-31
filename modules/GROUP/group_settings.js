import fetch from 'node-fetch'
import { getRealJid } from '../../core/identifier.js' 

export const groupConfig = {
    category: 'group',
    commands: {
        config_group: {
            name: 'config_group',
            alias: ['setwelcome', 'delwelcome', 'renombrar', 'setnombre', 'setname', 'desc', 'setdesc', 'setfoto', 'setpp', 'elimina', 'kick', 'ban', 'echar', 'sacar', 'tagall', 'todos', 'all', 'anuncio'],
            admin: true,
            group: true,
            botAdmin: true,
            run: async function (m, { conn, text, command, participants, chat }) {

                if (command === 'setwelcome') {
                    if (!text) return m.reply('> ✎ ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ.\nVariables disponibles:\n@us = Usuario\n@g = Nombre del grupo\n@t = Total miembros\n@d = Descripción\n@n = Nombre en mayúsculas\n\nEj: #setwelcome Hola @us\nBienvenido a @g')

                    let welcomeMessage = text;
                    if (text.toLowerCase() === '@rules') {
                        const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}))
                        welcomeMessage = groupMetadata.desc || 'No hay reglas definidas en este grupo.'
                    }

                    await global.Chat.updateOne({ id: m.chat }, { $set: { customWelcome: welcomeMessage } })
                    return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄᴏɴꜰɪɢ: ᴡᴇʟᴄᴏᴍᴇ ꜱᴇᴛ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (command === 'delwelcome') {
                    await global.Chat.updateOne({ id: m.chat }, { $set: { customWelcome: '' } })
                    return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄᴏɴꜰɪɢ: ᴡᴇʟᴄᴏᴍᴇ ʀᴇsᴇᴛ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (/renombrar|setnombre|setname/i.test(command)) {
                    if (!text) return m.reply('> ┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ɴᴏᴍʙʀᴇ.')
                    await conn.groupUpdateSubject(m.chat, text)
                    return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴏᴍʙʀᴇ ᴀᴄᴛᴜᴀʟ\n> ┃ ✎ ᴠᴀʟᴜᴇ: ${text}\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (/desc|setdesc/i.test(command)) {
                    let newDesc = m.quoted ? m.quoted.text : text
                    if (!newDesc) return m.reply('> ┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ʟᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏɴ.')
                    await conn.groupUpdateDescription(m.chat, newDesc)
                    return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ᴅᴇsᴄ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (/setfoto|setpp/i.test(command)) {
                    let q = m.quoted ? m.quoted : m
                    let mime = (q.msg || q).mimetype || ''
                    if (!/image/.test(mime)) return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ.')
                    let media = await q.download()
                    await conn.updateProfilePicture(m.chat, media)
                    return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ғᴏᴛᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (/elimina|kick|ban|echar|sacar/i.test(command)) {
                    let users = m.mentionedJid.concat(m.quoted ? [m.quoted.sender] : []).filter(u => u !== conn.user.jid)
                    if (users.length === 0) return m.reply('> ✎ ɪɴғᴏ: ᴇᴛɪǫᴜᴇᴛᴀ ᴀ ᴀʟɢᴜɪᴇɴ.')
                    
                    await conn.groupParticipantsUpdate(m.chat, users, 'remove')
                    
                  //  return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴜsᴜᴀʀɪᴏs ᴇʟɪᴍɪɴᴀᴅᴏs\n> ┗━━━━━━━━━━━━━━━━━━┛`)
                }

                if (/tagall|todos|all|anuncio/i.test(command)) {
                    let txt = `> ┏━━━〔 ᴀɴᴜɴᴄɪᴏ ɢʀᴜᴘᴀʟ 〕━━━┓\n> ┃ ✎ ᴍsɢ: ${text || 'sɪɴ ᴍᴏᴛɪᴠᴏ'}\n> ┃\n`

                    const realParticipants = await Promise.all(
                        participants.map(async (p) => {
                            return await getRealJid(conn, p.id, m);
                        })
                    );

                    for (let jid of realParticipants) {
                        txt += `> ┃ ✎ @${jid.split('@')[0]}\n`
                    }

                    txt += `> ┗━━━━━━━━━━━━━━━━━━┛`

                    return conn.sendMessage(m.chat, { 
                        text: txt, 
                        contextInfo: { 
                            mentionedJid: realParticipants,
                            groupMentions: [],
                            remoteJidAlt: m.chat
                        } 
                    }, { quoted: m })
                }

            }
        }
    }
};
