import fetch from 'node-fetch'
import { format } from 'util'

async function downloadHlsStream(m3u8Url) {
    const playlistRes = await fetch(m3u8Url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'referer': 'https://www.pinterest.com/'
        }
    });
    const playlistText = await playlistRes.text();

    const lines = playlistText.split('\n');
    const segmentUrls = [];
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

    for (let line of lines) {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            if (line.startsWith('http://') || line.startsWith('https://')) {
                segmentUrls.push(line);
            } else {
                segmentUrls.push(baseUrl + line);
            }
        }
    }

    if (segmentUrls.length === 0) {
        throw new Error('No se encontraron fragmentos de video válidos en el archivo playlist HLS.');
    }

    const segmentsBuffers = [];
    for (const segmentUrl of segmentUrls) {
        const segRes = await fetch(segmentUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'referer': 'https://www.pinterest.com/'
            }
        });
        if (!segRes.ok) continue;
        const chunk = await segRes.buffer();
        segmentsBuffers.push(chunk);
    }

    return Buffer.concat(segmentsBuffers);
}

export const getCommand = {
    category: 'tools',
    commands: {
        ytsearch: {
            name: 'get',
            alias: ['fetch'],
    run: async (m, { conn, text }) => {
        try {
            await m.react('⏳')

            let buffer, mime, name

            if (m.quoted) {
                mime = m.quoted.mimetype || ''
                buffer = await m.quoted.download()
                name = m.quoted.fileName || 'file'
            } else {
                if (!text || !/^https?:\/\//.test(text)) {
                    return conn.sendMessage(m.chat, { 
                        text: `┏━━━〔 sʏsᴛᴇᴍ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ᴜʀʟ ɪɴᴠᴀʟɪᴅ.\n┃ ✎ ᴜsᴀɢᴇ: .ɢᴇᴛ <ʟɪɴᴋ>\n┗━━━━━━━━━━━━━━━━━━┛` 
                    }, { quoted: m })
                }

                const cleanText = text.trim();

                if (cleanText.includes('.m3u8')) {
                    buffer = await downloadHlsStream(cleanText);
                    mime = 'video/mp4';
                    name = 'pinterest_video.mp4';
                } else {
                    const res = await fetch(cleanText, {
                        headers: {
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                            'referer': 'https://www.pinterest.com/'
                        }
                    });

                    mime = res.headers.get('content-type') || '';
                    buffer = await res.buffer();
                    name = cleanText.split('/').pop() || 'file';

                    if (name.includes('?')) {
                        name = name.split('?')[0];
                    }
                }
            }

            if (/json|javascript|text|html|css|xml/.test(mime) || !mime) {
                let txt = buffer.toString('utf-8')
                try {
                    txt = JSON.stringify(JSON.parse(txt), null, 2)
                } catch {}

                await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
                return m.react('✅')
            } 

            if (/image/.test(mime)) {
                await conn.sendMessage(m.chat, { image: buffer, caption: name }, { quoted: m })
            } 
            else if (/video/.test(mime) || name.endsWith('.mp4') || name.endsWith('.ts')) {
                await conn.sendMessage(m.chat, { 
                    video: buffer, 
                    mimetype: 'video/mp4', 
                    caption: name 
                }, { quoted: m })
            } 
            else if (/audio/.test(mime)) {
                await conn.sendMessage(m.chat, { audio: buffer, mimetype: mime, ptt: false }, { quoted: m })
            } 
            else {
                await conn.sendMessage(m.chat, { 
                    document: buffer, 
                    mimetype: mime, 
                    fileName: name 
                }, { quoted: m })
            }

            await m.react('📡')

        } catch (err) {
            console.error(err)
            await m.react('❌')
            await conn.sendMessage(m.chat, { 
                text: `┏━━━〔 ғᴀᴛᴀʟ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ᴍsɢ: ${err.message}\n┗━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: m })
            }
         }
      }
   }
 };