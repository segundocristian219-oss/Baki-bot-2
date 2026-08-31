import axios from 'axios';

export const poemaCommand = {
    category: 'fun',
    commands: {
        poema: {
            name: 'poema',
            alias: ['verso', 'poesia'],
            run: async (m, { conn, text }) => {
                const urlRaw = 'https://raw.githubusercontent.com/eliac-d/database/main/src/poemas.json';

                try {
                    const response = await axios.get(urlRaw);
                    let lista = Array.isArray(response.data) ? response.data : (response.data?.poemas_masivos || []);

                    if (!Array.isArray(lista)) return;

                    if (text) {
                        lista = lista.filter(p => 
                            p.autor.toLowerCase().includes(text.toLowerCase()) || 
                            p.titulo.toLowerCase().includes(text.toLowerCase())
                        );
                    }

                    if (lista.length === 0) {
                        console.warn("Advertencia: La lista de poemas está vacía o el filtro de búsqueda no arrojó resultados.");
                        return;
                    }

                    const p = lista[Math.floor(Math.random() * lista.length)];

                    const mensaje = `\n\n${p.texto}\n\n_— ${p.autor}_ (${p.estilo})`;

                    await conn.sendPreviewMessage(m.chat, mensaje, {
                        type: 1, 
                        ratio: 'landscape',
                        url: global.surl(conn),
                        thumbnail: "https://cdn.dix.lat/me/68611391-1e0b-4b86-88b5-11b7898639a6.png",
                        title: `CATEGORÍA: ${p.titulo.toUpperCase()}`,
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            mentionedJid: [m.sender]
                        }
                    });

                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
};
