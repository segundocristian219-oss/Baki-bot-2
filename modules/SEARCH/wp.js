import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://alphacoders.com/',
};

const CATEGORIES = [
    { id: 1,  emoji: '💥', label: 'Anime',       alpha: (p) => `https://alphacoders.com/anime-wallpapers?page=${p}`,      cave: 'anime',      access: 'anime' },
    { id: 2,  emoji: '🎮', label: 'Pixel Art',   alpha: (p) => `https://alphacoders.com/pixel-art-wallpapers?page=${p}`,  cave: 'pixel-art',  access: 'pixel-art' },
    { id: 3,  emoji: '🌿', label: 'Nature',      alpha: (p) => `https://alphacoders.com/nature-wallpapers?page=${p}`,     cave: 'nature',     access: 'nature' },
    { id: 4,  emoji: '🤖', label: 'Futuristic',  alpha: (p) => `https://alphacoders.com/futuristic-wallpapers?page=${p}`, cave: 'futuristic', access: 'futuristic' },
    { id: 5,  emoji: '🌌', label: 'Universe',    alpha: (p) => `https://alphacoders.com/universe-wallpapers?page=${p}`,   cave: 'universe',   access: 'universe' },
    { id: 6,  emoji: '🔭', label: 'Galaxy',      alpha: (p) => `https://alphacoders.com/galaxy-wallpapers?page=${p}`,     cave: 'galaxy',     access: 'galaxy' },
    { id: 7,  emoji: '🐾', label: 'Animales',    alpha: (p) => `https://alphacoders.com/animals-wallpapers?page=${p}`,    cave: 'animals',    access: 'animals' },
    { id: 8,  emoji: '🏙️', label: 'Ciudad',      alpha: (p) => `https://alphacoders.com/city-wallpapers?page=${p}`,       cave: 'city',       access: 'city' },
    { id: 9,  emoji: '🎨', label: 'Arte',        alpha: (p) => `https://alphacoders.com/art-wallpapers?page=${p}`,        cave: 'art',        access: 'art' },
    { id: 10, emoji: '🌸', label: 'Aesthetic',   alpha: (p) => `https://alphacoders.com/aesthetic-wallpapers?page=${p}`,  cave: 'aesthetic',  access: 'aesthetic' },
];

const MENU = CATEGORIES.map(c => `> *${c.id}.* ${c.emoji} ${c.label}`).join('\n');

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function extractAlphaImages($) {
    const urls = [];
    $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (
            src.includes('alphacoders.com') &&
            (src.includes('thumbbig') || src.includes('thumb-1920')) &&
            !urls.includes(src)
        ) urls.push(src);
    });
    return urls;
}

async function scrapeAlpha(alphaFn) {
    try {
        const page = Math.floor(Math.random() * 25) + 1;
        const res = await axios.get(alphaFn(page), { headers: HEADERS, timeout: 12000 });
        return extractAlphaImages(cheerio.load(res.data));
    } catch { return []; }
}

async function scrapeWallpaperCave(slug) {
    const candidates = [
        `https://wallpapercave.com/${slug}-wallpapers`,
        `https://wallpapercave.com/${slug}-wallpaper`,
        `https://wallpapercave.com/${slug}`,
    ];
    for (const url of candidates) {
        try {
            const res = await axios.get(url, { headers: { ...HEADERS, Referer: 'https://wallpapercave.com/' }, timeout: 12000 });
            if (res.status !== 200) continue;
            const $ = cheerio.load(res.data);
            const urls = [];
            $('img[src*="wallpapercave.com/wp/"]').each((_, el) => {
                const src = $(el).attr('src') || '';
                if (src.includes('.jpg') && !urls.includes(src)) urls.push(src);
            });
            if (urls.length > 0) return urls;
        } catch { continue; }
    }
    return [];
}

async function scrapeWallpaperAccess(slug) {
    try {
        const res = await axios.get(`https://wallpaperaccess.com/${slug}`, { headers: { ...HEADERS, Referer: 'https://wallpaperaccess.com/' }, timeout: 12000 });
        const $ = cheerio.load(res.data);
        const urls = [];
        $('a[href*="/download/"]').each((_, el) => {
            const match = ($(el).attr('href') || '').match(/\/download\/[^-]+-(\d+)/);
            if (match?.[1]) {
                const full = `https://wallpaperaccess.com/full/${match[1]}.jpg`;
                if (!urls.includes(full)) urls.push(full);
            }
        });
        return urls;
    } catch { return []; }
}

function sourceName(url) {
    if (url.includes('alphacoders')) return 'AlphaCoders';
    if (url.includes('wallpapercave')) return 'WallpaperCave';
    if (url.includes('wallpaperaccess')) return 'WallpaperAccess';
    return 'Web';
}

async function fetchWallpapers(cat) {
    const [alpha, cave, access] = await Promise.allSettled([
        scrapeAlpha(cat.alpha),
        scrapeWallpaperCave(cat.cave),
        scrapeWallpaperAccess(cat.access),
    ]);

    const a = alpha.status === 'fulfilled' ? alpha.value : [];
    const c = cave.status === 'fulfilled' ? cave.value : [];
    const w = access.status === 'fulfilled' ? access.value : [];

    let pool = [];
    if (a.length) pool.push(...shuffle(a).slice(0, 2));
    if (c.length) pool.push(...shuffle(c).slice(0, 1));
    if (w.length) pool.push(...shuffle(w).slice(0, 1));
    pool = shuffle(pool);

    if (pool.length < 4) {
        const extras = shuffle([...a, ...c, ...w]).filter(u => !pool.includes(u));
        pool.push(...extras.slice(0, 4 - pool.length));
    }

    return [...new Set(pool)].slice(0, 4);
}

async function sendAlbum(conn, jid, urls, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: urls.length,
            ...(options.quoted ? {
                contextInfo: {
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    await Promise.all(urls.map(async (url, i) => {
        const msg = await conn.generateWAMessage(jid, {
            image: { url },
            ...(i === 0 ? { caption: options.caption || '' } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };

        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}

export const wallCommand = {
    category: 'search',
    commands: {
        wall: {
            name: 'wall',
            alias: ['wallpaper', 'wp'],
            run: async (m, { conn, text }) => {
                if (!text?.trim()) {
                    return conn.reply(m.chat,
                        `🖼️ *WALLPAPERS*\n\n` +
                        `Elige una categoría enviando:\n` +
                        `*.wall [número]*\n\n` +
                        MENU,
                    m);
                }

                const num = parseInt(text.trim());

                if (isNaN(num) || num < 1 || num > CATEGORIES.length) {
                    return conn.reply(m.chat,
                        `> ❌ Número inválido. Elige entre 1 y ${CATEGORIES.length}:\n\n` + MENU,
                    m);
                }

                const cat = CATEGORIES[num - 1];

                try {
                    await m.react('🕒');

                    const imageUrls = await fetchWallpapers(cat);

                    if (!imageUrls || imageUrls.length === 0) {
                        await m.react('❌');
                        return conn.reply(m.chat, `> ⍰ No se encontraron wallpapers para *${cat.label}*`, m);
                    }

                    const sources = [...new Set(imageUrls.map(sourceName))].join(', ');

                    const caption =
                        `${cat.emoji} *${cat.label.toUpperCase()} WALLPAPERS*\n\n` +
                        `> CATEGORÍA: ${cat.label}\n` +
                        `> CANTIDAD: ${imageUrls.length}\n` +
                        `> FUENTES: ${sources}`;

                    await sendAlbum(conn, m.chat, imageUrls, { caption, quoted: m });
                    await m.react('✅');

                } catch (error) {
                    await m.react('❌');
                    console.error(`> [ERROR WALL]: ${error.message}`);
                    conn.reply(m.chat, `> ⚔ Error: ${error.message}`, m);
                }
            }
        }
    }
};
