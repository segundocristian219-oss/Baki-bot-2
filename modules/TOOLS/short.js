import fetch from 'node-fetch';

export const shortCommand = {
    category: 'tools',
    commands: {
        short: {
            name: 'short',
            alias: ['acortar', 'short', 'corta'],
            run: async (m, { text }) => {
                const apiVercel = 'https://dix.lat/short';

                if (!text) return m.reply('> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ.');

                try {
                    await m.react('🕓');

                    const res = await fetch(apiVercel, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: text })
                    });

                    
                    const json = await res.json();

                    if (json.status) {
                        const shortUrl = json.url;
                        
                        let txt = `> 🔗 *ᴇɴʟᴀᴄᴇ ᴀᴄᴏʀᴛᴀᴅᴏ*\n\n`;
                        txt += `> ✧ *ᴏʀɪɢɪɴᴀʟ:* ${text}\n`;
                        txt += `> ✧ *ᴄᴏʀᴛᴏ:* ${shortUrl}\n`;
                        txt += `> ☁️ *ɪɴғᴏ:* Developed by dix.lat.`;

                        await m.reply(txt);
                        await m.react('✅');
                    } else {
                        
                        await m.react('✖️');
                        
                        await m.reply(`❌ *Error de la API:*\n${JSON.stringify(json, null, 2)}`);
                    }
                } catch (e) {
                    await m.react('✖️');
                    
                    m.reply(`❌ *Error Crudo:* ${e.stack || e.message || e}`);
                }
            }
        }
    }
};