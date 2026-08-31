import fetch from 'node-fetch';
import yts from 'yt-search';

const HEADERS = {
  'User-Agent': 'DeylinLyricsBot/2.0'
};

function cleanLyrics(lyrics = '') {
  return String(lyrics)
    .replace(/\r/g, '')
    .replace(/^\[\d{1,2}:\d{2}(?:[.:]\d{1,2})?\]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatLyrics(title, artist, lyrics) {
  return (
    `*走    LETRA ENCONTRADA*\n\n` +
    `> ▢ *TÍTULO:* ${title || 'Desconocido'}\n` +
    `> ▢ *ARTISTA:* ${artist || 'Desconocido'}\n\n` +
    `${lyrics || 'Letra no disponible.'}`
  );
}

async function fetchYouTubeTitle(query) {
  try {
    const searchResult = await yts(query);
    const video = searchResult?.videos?.[0];
    if (!video) return null;

    let title = video.title;

    title = title
      .replace(/\b(official video|official audio|lyric video|lyrics|mv|video oficial|letra|audio oficial|hd|4k|remix|videoclip|en vivo|live)\b/gi, '')
      .replace(/[\[\](){}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return title;
  } catch {
    return null;
  }
}

async function getLyricsFromDelirius(cleanTitle) {
  try {
    const url = `https://api.delirius.online/search/lyrics?query=${encodeURIComponent(cleanTitle)}`;
    
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    
    const body = await res.json();
    
    if (!body.status || !body.data || !body.data.lyrics) return null;

    return {
      title: body.data.title,
      artist: body.data.artists,
      lyrics: cleanLyrics(body.data.lyrics)
    };
  } catch {
    return null;
  }
}

export const lyricsCommand = {
  category: 'tools',
  commands: {
    letra: {
      name: 'letra',
      alias: ['lyrics', 'lrc'],
      run: async (m, { text, usedPrefix, command }) => {
        if (!text) {
          return m.reply(
            `> ✎ USO: ${usedPrefix + command} <nombre de la canción o frase>\n` +
            `> ✎ Ejemplo: ${usedPrefix + command} 100 años contigo`
          );
        }

        await m.react('🔍');

        try {
          const cleanTitle = await fetchYouTubeTitle(text);
          if (!cleanTitle) {
            await m.react('✖️');
            return m.reply('> ⚔ ERROR: No se encontró ningún resultado en YouTube.');
          }

          const result = await getLyricsFromDelirius(cleanTitle);

          if (!result || !result.lyrics) {
            await m.react('✖️');
            return m.reply(
              `> ⚔ ERROR: No encontré la letra en la base de datos.\n` +
              `> ▢ *Buscado como:* ${cleanTitle}`
            );
          }

          await m.react('✅');
          return m.reply(
            formatLyrics(
              result.title,
              result.artist,
              result.lyrics
            )
          );
        } catch (e) {
          await m.react('✖️');
          return m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
      }
    }
  }
};
