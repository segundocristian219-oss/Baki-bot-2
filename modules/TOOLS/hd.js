import axios from 'axios';
import FormData from 'form-data';
import { Buffer } from 'node:buffer';

export const hdCommand = {
    category: 'tools',
    commands: {
        hd: {
            name: 'hd',
            alias: ['remini', 'upscale', 'mejorar'],
            run: async (m, { conn, args }) => {
                const q = m.quoted ? m.quoted : m;
                try {
                    const mime = (q.msg || q).mimetype || q.mediaType || '';
                    if (!mime || !mime.startsWith('image/')) {
                        return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Envía o responde a una imagen.');
                    }

                    const method = parseInt(args[0]) || 1;
                    const quality = args[1]?.toLowerCase() || 'medium';

                    await m.react('⚙️');

                    const buffer = await q.download();
                    const enhancedBuffer = await ihancer(buffer, { method, size: quality });

                    await conn.sendMessage(m.chat, { 
                        image: enhancedBuffer,
                        caption: `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗘𝗦𝗧𝗔𝗧𝗨𝗦: Optimizada\n❖ 𝗠𝗘𝗧𝗢𝗗𝗢: ${method}\n❖ 𝗖𝗔𝗟𝗜𝗗𝗔𝗗: ${quality}`,
                    }, { quoted: m });

                    await m.react('✅');
                } catch (error) {
                    console.error(error);
                    m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${error.message}`);
                }
            }
        }
    }
};

async function ihancer(buffer, { method = 1, size = 'low' } = {}) {
    const _size = ['low', 'medium', 'high'];
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Imagen requerida');

    const form = new FormData();
    form.append('method', method.toString());
    form.append('is_pro_version', 'false');
    form.append('is_enhancing_more', 'false');
    form.append('max_image_size', size);
    form.append('file', buffer, `file_${Date.now()}.jpg`);

    const { data } = await axios.post('https://ihancer.com/api/enhance', form, {
        headers: {
            ...form.getHeaders(),
            'accept-encoding': 'gzip',
            'host': 'ihancer.com',
            'user-agent': 'Dart/3.5 (dart:io)'
        },
        responseType: 'arraybuffer'
    });

    return Buffer.from(data);
}
