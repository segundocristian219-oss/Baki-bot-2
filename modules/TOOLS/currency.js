import axios from 'axios';

const moduleData = {
    utilidad: {
        category: 'Utilidad',
        commands: {
            moneda: {
                name: 'moneda',
                alias: ['convertir', 'divisa', 'currency'],
                desc: 'Convierte una cantidad de dinero de una divisa a otra.',
                // CORRECCIÓN: 'm' es el primer parámetro, y el objeto con los datos es el segundo
                run: async (m, { args, usedPrefix, command, conn }) => {
                    
                    if (!args || args.length < 3) {
                        const prefix = usedPrefix || '.';
                        const uso = `*💱 USO CORRECTO DEL COMANDO* 💱\n\n` +
                                    `Formato: \`${prefix}${command} [cantidad] [divisa_origen] [divisa_destino]\`\n\n` +
                                    `*Ejemplo:* \`${prefix}${command} 100 usd mxn\`\n` +
                                    `*Ejemplo:* \`${prefix}${command} 2500 eur ars\`\n\n` +
                                    `_Divisas populares: USD, EUR, MXN, ARS, COP, PEN, CLP, BRL_`;
                        return conn.sendMessage(m.chat, { text: uso }, { quoted: m });
                    }

                    const cantidad = parseFloat(args[0]);
                    const de = args[1].toUpperCase();
                    const a = args[2].toUpperCase();

                    if (isNaN(cantidad)) {
                        return conn.sendMessage(m.chat, { text: '❌ La cantidad ingresada debe ser un número válido.' }, { quoted: m });
                    }

                    try {
                        const url = `https://open.er-api.com/v6/latest/${de}`;
                        const response = await axios.get(url);
                        
                        if (response.data.result === 'error') {
                            return conn.sendMessage(m.chat, { text: `❌ No se pudo encontrar la divisa de origen: *${de}*. Verifica el código de moneda.` }, { quoted: m });
                        }

                        const rates = response.data.rates;
                        if (!rates[a]) {
                            return conn.sendMessage(m.chat, { text: `❌ No se encontró la divisa de destino: *${a}*. Verifica el código de moneda.` }, { quoted: m });
                        }

                        const tasa = rates[a];
                        const resultado = (cantidad * tasa).toFixed(2);
                        
                        const cantFormateada = cantidad.toLocaleString('es-MX', { minimumFractionDigits: 2 });
                        const resFormateada = parseFloat(resultado).toLocaleString('es-MX', { minimumFractionDigits: 2 });

                        const mensaje = `*💱 CONVERSOR DE DIVISAS 💱*\n\n` +
                                        `• *Monto original:* ${cantFormateada} _${de}_\n` +
                                        `• *Monto convertido:* ${resFormateada} _${a}_\n\n` +
                                        `• *Tasa de cambio:* 1 ${de} = ${tasa.toFixed(4)} ${a}\n\n` +
                                        `_📅 Datos actualizados automáticamente._`;

                        await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });

                    } catch (error) {
                        await conn.sendMessage(m.chat, { text: '❌ Ocurrió un error al obtener las tasas de cambio. Inténtalo más tarde.' }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
