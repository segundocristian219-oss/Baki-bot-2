import fetch from 'node-fetch';
import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const emojiAnimatedCommand = {
  category: 'sticker',
  commands: {
    emoji: {
      name: 'emoji',
      alias: ['emo'],
      run: async (m, { conn, args, text }) => {
        try {
          let emojiArg = args[0];
          if (!emojiArg) return m.reply('> *✎ Indica un emoji o código (ej: 1f916).*');

          await m.react('🕓');

          let emojiCode = emojiArg.includes('1f')
            ? emojiArg
            : [...emojiArg].map(c => c.codePointAt(0).toString(16)).join('-');

          const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiCode}/512.gif`;

          const response = await fetch(url);
          if (!response.ok) return m.reply('> ⚔ No encontré la animación para ese emoji.');

          const gifBuffer = await response.buffer();
          const uint8Array = new Uint8Array(gifBuffer.buffer, gifBuffer.byteOffset, gifBuffer.byteLength);

          let [packName, packPublisher] = text.includes('|')
            ? text.split('|').map(s => s.trim())
            : [name(conn), m.pushName || 'User'];

          let workerResult = await dispatchMediaTask({
            type: 'convert_emoji_gif',
            data: uint8Array,
            packname: packName,
            author: packPublisher,
            emojis: [emojiArg]
          });

          if (!workerResult || !workerResult.buffer) {
            throw new Error("El subproceso de emojis animados devolvió un contenido vacío.");
          }

          await conn.sendMessage(
            m.chat,
            {
              sticker: workerResult.buffer,
              contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                ...channelInfo
              },
            },
            { quoted: m }
          );

          await m.react('✅');
        } catch (error) {
          console.error(error);
          await m.react('✖️');
          m.reply('> ⚔ Error en la conversión: ' + error.message);
        }
      }
    }
  }
};
