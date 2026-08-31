import fetch from 'node-fetch';

export const nsfwDeliriusCommands = {
    category: 'nsfw',
    commands: {
        corean: {
            name: 'corean',
            alias: ['coreanas', 'korean'],
            nsfw: true,
            run: async (m, { conn }) => {
                try {
                    await m.react('🕒');

                    const url = 'https://api.delirius.online/nsfw/corean';
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });

                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                    const buffer = Buffer.from(await res.arrayBuffer());

                    await conn.sendMessage(m.chat, {
                        image: buffer,
                        caption: '*─── [ 🔞 NSFW COREAN ] ───*',
                        mentions: [m.sender]
                    }, { quoted: m });

                    await m.react('✔️');
                } catch (e) {
                    await m.react('✖️');
                    await m.reply(`> [Error Crítico: *${e.message}*]`);
                }
            }
        },
        girls: {
            name: 'girls',
            alias: ['nsfwgirls'],
            nsfw: true,
            run: async (m, { conn }) => {
                try {
                    await m.react('🕒');

                    const url = 'https://api.delirius.online/nsfw/girls';
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });

                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                    const buffer = Buffer.from(await res.arrayBuffer());

                    await conn.sendMessage(m.chat, {
                        image: buffer,
                        caption: '*─── [ 🔞 NSFW GIRLS ] ───*',
                        mentions: [m.sender]
                    }, { quoted: m });

                    await m.react('✔️');
                } catch (e) {
                    await m.react('✖️');
                    await m.reply(`> [Error Crítico: *${e.message}*]`);
                }
            }
        },
        boobs: {
            name: 'boobs',
            alias: ['titas', 'pechos'],
            nsfw: true,
            run: async (m, { conn }) => {
                try {
                    await m.react('🕒');

                    const url = 'https://api.delirius.online/nsfw/boobs';
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });

                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                    const buffer = Buffer.from(await res.arrayBuffer());

                    await conn.sendMessage(m.chat, {
                        image: buffer,
                        caption: '*─── [ 🔞 NSFW BOOBS ] ───*',
                        mentions: [m.sender]
                    }, { quoted: m });

                    await m.react('✔️');
                } catch (e) {
                    await m.react('✖️');
                    await m.reply(`> [Error Crítico: *${e.message}*]`);
                }
            }
        }
    }
};
