import axios from 'axios';

export const nsfwCommand = {
    category: 'nsfw',
    commands: {
        waifu: {
            name: 'waifu',
            alias: ['woman'],
            nsfw: true,
            run: async (m, { conn }) => {
                try {
                    await m.react('⏳');
                    const response = await axios.get('https://api.yuki-wabot.my.id/nsfw/waifu', { responseType: 'arraybuffer' });
                    if (!response.data) throw new Error();
                    await conn.sendMessage(m.chat, { image: Buffer.from(response.data), caption: '_Aquí tienes tu imagen._' }, { quoted: m });
                    await m.react('✅');
                } catch (e) {
                    await m.react('✖️');
                }
            }
        },
        fuck: {
            name: 'fuck',
            alias: ['fuck'],
            nsfw: true,
            run: async (m, { conn }) => {
                const reaction = {
                    emoji: '🥵',
                    txt_solo: '> ❒ @user1 quiere hacer el delicioso.',
                    txt_mencion: '> ❏ @user1 le está haciendo el delicioso a @user2 como nunca se lo avían echo. 🥵\n que salvaje...',
                    links: [
                        'https://cdn.dix.lat/me/d5baace6-1279-4e5f-9557-e28267b4d913.mp4',
                        'https://cdn.dix.lat/me/0a8623ca-e6db-41fa-a4e5-b6cfe9f53987.mp4',
                        'https://cdn.dix.lat/me/133ca5ad-cfd1-42d6-86dc-950971ec9c6a.mp4'
                    ]
                };
                const user1 = m.sender;
                const user2 = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
                const name1 = '@' + user1.split('@')[0];
                const menciones = [user1];
                let textoFinal = '';
                if (user2) {
                    menciones.push(user2);
                    textoFinal = reaction.txt_mencion.replace(/@user1/g, name1).replace(/@user2/g, '@' + user2.split('@')[0]);
                } else {
                    textoFinal = reaction.txt_solo.replace(/@user1/g, name1);
                }
                await m.react(reaction.emoji);
                await conn.sendMessage(m.chat, { video: { url: reaction.links[Math.floor(Math.random() * reaction.links.length)] }, caption: textoFinal, gifPlayback: true, mentions: menciones }, { quoted: m });
            }
        },
        cum: {
            name: 'cum',
            alias: ['leche'],
            nsfw: true,
            run: async (m, { conn }) => {
                const reaction = {
                    emoji: '💦',
                    txt_solo: '> ❒ @user1 quiere leche 🍆💦',
                    txt_mencion: '> ❏ @user1 le está dando leche a @user2 🍆💦',
                    links: [
                        'https://cdn.dix.lat/me/4b854462-2420-4aa8-84f4-6871b3e035db.mp4',
                        'https://cdn.dix.lat/me/4d2ee2e0-f29c-44fb-a039-0cd25442901c.mp4',
                        'https://cdn.dix.lat/me/f2633756-92ac-4533-a9c1-b3a017376fb5.mp4'
                    ]
                };
                const user1 = m.sender;
                const user2 = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
                const name1 = '@' + user1.split('@')[0];
                const menciones = [user1];
                let textoFinal = '';
                if (user2) {
                    menciones.push(user2);
                    textoFinal = reaction.txt_mencion.replace(/@user1/g, name1).replace(/@user2/g, '@' + user2.split('@')[0]);
                } else {
                    textoFinal = reaction.txt_solo.replace(/@user1/g, name1);
                }
                await m.react(reaction.emoji);
                await conn.sendMessage(m.chat, { video: { url: reaction.links[Math.floor(Math.random() * reaction.links.length)] }, caption: textoFinal, gifPlayback: true, mentions: menciones }, { quoted: m });
            }
        }
    }
};
