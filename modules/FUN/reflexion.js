import axios from 'axios';

export const reflexionCommand = {
    category: 'fun',
    commands: {
        reflexion: {
            name: 'reflexion',
            alias: ['reflexión', 'meditar', 'existencia'],
            run: async (m, { conn, text }) => {
                const urlRaw = 'https://raw.githubusercontent.com/eliac-d/database/main/src/reflexion.json';
                let i = ['https://cdn.dix.lat/me/de846591-80aa-4af2-86f2-bcb9cbe71d9a.jpg', 'https://cdn.dix.lat/me/56061ccd-9c22-4b3b-b95c-e6334009b7f2.jpg', 'https://cdn.dix.lat/me/b267_5262fa25-fb20-4f98-bba7-42f8f0eb276c.png'];
                let ii = i[Math.floor(Math.random() * i.length)];

                try {
                    const response = await axios.get(urlRaw);
                    const lista = Array.isArray(response.data) ? response.data : response.data.reflexiones;
                    let filtradas = lista;

                    if (text) {
                        filtradas = lista.filter(r => 
                            r.tema.toLowerCase().includes(text.toLowerCase()) ||
                            r.titulo.toLowerCase().includes(text.toLowerCase())
                        );
                    }

                    if (filtradas.length === 0) filtradas = lista;

                    const r = filtradas[Math.floor(Math.random() * filtradas.length)];

                    const mensaje = `──────────────────\n\n` +
                                  `${r.wa_format}\n\n` +
                                  `*Propósito:* _Apoyo emocional digital._`;

                    await conn.sendPreviewMessage(m.chat, mensaje, {
                        type: 1, 
                        ratio: 'landscape',
                        url: global.surl(conn),
                        thumbnail: ii,
                        title: r.titulo,
                        body: `CATEGORÍA: ${r.tema}`,
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo,
                            mentionedJid: [m.sender]
                        }
                    });

                } catch (error) {
                    console.error('Error en suministro de reflexiones:', error);
                    await conn.sendMessage(m.chat, { text: '❌ Error al conectar con la base de datos estelar.' }, { quoted: m });
                }
            }
        }
    }
};
