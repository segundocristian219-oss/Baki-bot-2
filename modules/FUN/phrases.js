import axios from 'axios';

export const frasesCommand = {
    category: 'fun',
    commands: {
        frases: {
            name: 'frases',
            alias: ['frase', 'cita'],
            run: async (m, { conn, text }) => {
                const urlRaw = 'https://raw.githubusercontent.com/eliac-d/database/main/src/frases.json';

                try {
                    const response = await axios.get(urlRaw);
                    let lista = response.data.frases_masivas;

                    if (text) {
                        lista = lista.filter(r => 
                            r.categoria.toLowerCase().includes(text.toLowerCase()) || 
                            r.autor.toLowerCase().includes(text.toLowerCase())
                        );
                    }

                    if (lista.length === 0) return;

                    const r = lista[Math.floor(Math.random() * lista.length)];

                    const mensaje = `✨ *FRASE DEL DÍA*\n\n` +
                                  `*Categoría:* _${r.categoria}_\n` +
                                  `──────────────────\n\n` +
                                  `"${r.texto}"\n\n` +
                                  `— *${r.autor}*`;

                    await conn.sendMessage(m.chat, { 
                        text: mensaje,
                        mentions: [m.sender] 
                    }, { quoted: m });

                } catch (error) {
                    console.error('Error en suministro de frases:', error);
                }
            }
        }
    }
};
