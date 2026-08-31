import axios from 'axios';

const moduleData = {
    utilidad: {
        category: 'Utilidad',
        commands: {
            clima: {
                name: 'clima',
                alias: ['weather', 'tiempo'],
                desc: 'Muestra el estado del clima de una ciudad.',
                run: async (m, { text, usedPrefix, command, conn }) => {
                    if (!text) return conn.sendMessage(m.chat, { text: `❌ Especifica una ciudad.\n\n*Ejemplo:* ${usedPrefix}${command} Buenos Aires` }, { quoted: m });

                    try {
                        // Usamos la API wttr.in solicitando la respuesta en español directamente (?lang=es)
                        const response = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=j1&lang=es`);
                        
                        const data = response.data.current_condition?.[0];
                        if (!data) {
                            return conn.sendMessage(m.chat, { text: '❌ No se pudieron obtener los datos meteorológicos para esta ubicación.' }, { quoted: m });
                        }

                        // Validamos de forma segura que existan los datos del área geográfica
                        const area = response.data.nearest_area?.[0];
                        const ciudad = area?.areaName?.[0]?.value || text;
                        const pais = area?.country?.[0]?.value || 'No especificado';
                        
                        const temp = data.temp_C;
                        const sensacion = data.FeelsLikeC;
                        const humedad = data.humidity;
                        const viento = data.windspeedKmph;
                        
                        // Buscamos la descripción en español si existe, si no, usamos la de inglés
                        const desc = data.lang_es?.[0]?.value || data.weatherDesc?.[0]?.value || 'Despejado';

                        const info = `🌦️ *ESTADO DEL CLIMA* 🌦️\n\n` +
                                     `• *Ubicación:* ${ciudad}, ${pais}\n` +
                                     `• *Condición:* ${desc}\n` +
                                     `• *Temperatura:* ${temp}°C\n` +
                                     `• *Sensación Térmica:* ${sensacion}°C\n` +
                                     `• *Humedad:* ${humedad}%\n` +
                                     `• *Viento:* ${viento} km/h`;

                        await conn.sendMessage(m.chat, { text: info }, { quoted: m });
                    } catch (e) {
                        console.error(e);
                        await conn.sendMessage(m.chat, { text: '❌ No se encontró la ciudad o el servicio meteorológico no está disponible en este momento.' }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
