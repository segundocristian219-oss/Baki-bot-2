const moduleData = {
    juegos: {
        category: 'Juegos',
        commands: {
            cuenta: {
                name: 'cuenta',
                alias: ['timer', 'countdown'],
                desc: 'Inicia una cuenta regresiva visual.',
                run: async (m, { args, usedPrefix, command, conn }) => {
                    let segundos = parseInt(args[0]);
                    if (isNaN(segundos) || segundos < 1 || segundos > 10000) {
                        return conn.sendMessage(m.chat, { text: `❌ Ingresa un número de segundos válido (Entre 1 y 10000).\n\n*Ejemplo:* ${usedPrefix}${command} 5` }, { quoted: m });
                    }

                    let { key } = await conn.sendMessage(m.chat, { text: `⏳ *Iniciando cuenta regresiva:* ${segundos}...` }, { quoted: m });

                    const intervalo = setInterval(async () => {
                        segundos--;
                        if (segundos > 0) {
                            await conn.sendMessage(m.chat, { text: `⏳ *Cuenta regresiva:* ${segundos}...`, edit: key }).catch(() => clearInterval(intervalo));
                        } else {
                            clearInterval(intervalo);
                            await conn.sendMessage(m.chat, { text: `💥 ¡TIEMPO TERMINADO! 💥`, edit: key }).catch(() => null);
                        }
                    }, 1000);
                }
            }
        }
    }
};

export default moduleData;
