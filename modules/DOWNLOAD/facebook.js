import fetch from 'node-fetch'

export const facebookDownloadModule = {
    category: 'descargas',
    commands: {
        facebook: {
            name: 'facebook',
            alias: ['fb', 'fbdl'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                if (!args[0]) return m.reply(`*⍰ Ingresa un enlace de Facebook...*`)

                const regexFacebook = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch|fb\.gg)\/[^\s]+$/i
                if (!regexFacebook.test(args[0])) return m.reply(`*ஐ Enlace de Facebook no válido.*`)

                try {
                    if (m.react) await m.react("⏳")

                    const response = await fetch(`https://dix.lat/v1/facebook?url=${encodeURIComponent(args[0])}`)

                    const json = await response.json()

                    if (!json.success || !json.data || !Array.isArray(json.data.data) || json.data.data.length === 0) {
                        throw new Error("No data found")
                    }

                    const directMedia = json.data.data.find(item => !item.shouldRender && item.url)

                    if (!directMedia) {
                        throw new Error("No direct download link available")
                    }

                    const videoUrl = directMedia.url
                    const quality = directMedia.resolution || "SD"

                    const caption = `\t\t\t 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n> ღ *Título:* Video de Facebook\n> ✰ *Calidad:* ${quality}\n> ✎ *Enlace:* ${args[0]}\n\n`

                    const videoRes = await fetch(videoUrl, {
                        headers: {
                            'user-agent': 'TelegramBot (like TwitterBot)'
                        }
                    })

                    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
                    const sizeMB = videoBuffer.length / (1024 * 1024)

                    if (sizeMB > 80) {
                        await conn.sendMessage(m.chat, { 
                            document: videoBuffer, 
                            caption: caption,
                            fileName: `fb_video.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m })
                    } else {
                        await conn.sendMessage(m.chat, { 
                            video: videoBuffer, 
                            caption: caption,
                            fileName: `fb_video.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m })
                    }

                    if (m.react) await m.react("✅")

                } catch (e) {
                    console.error(e)
                    if (m.react) await m.react("❌")
                    m.reply("卍 Error al procesar Facebook. El video podría ser privado o el enlace ha expirado.\n\nUsa el comando *#report* para reportar este error.")
                }
            }
        }
    }
}
