const palabras = [
    { palabra: 'PROGRAMACION', pista: 'Actividad de escribir código para software' },
    { palabra: 'WHATSAPP', pista: 'Aplicación de mensajería instantánea' },
    { palabra: 'JAVASCRIPT', pista: 'Lenguaje de programación popular en la web' },
    { palabra: 'TECLADO', pista: 'Periférico usado para escribir en la computadora' },
    { palabra: 'DATABASE', pista: 'Lugar donde se almacenan y organizan los datos' },
    { palabra: 'INTERNET', pista: 'Red global de redes de comunicación' },
    { palabra: 'ALGORITMO', pista: 'Conjunto ordenado de instrucciones para resolver un problema' },
    { palabra: 'SERVIDOR', pista: 'Equipo informático que provee servicios a otros equipos' },
    { palabra: 'PANTALLA', pista: 'Superficie donde se muestran las imágenes del dispositivo' },
    { palabra: 'AUDIFONOS', pista: 'Dispositivo para escuchar audio de forma privada' },
    { palabra: 'PYTHON', pista: 'Lenguaje de programación famoso por su sencillez' },
    { palabra: 'GITHUB', pista: 'Plataforma para alojar y compartir proyectos de código' },
    { palabra: 'SISTEMA', pista: 'Conjunto de elementos que interactúan entre sí' },
    { palabra: 'MEMORIA', pista: 'Componente que almacena información temporal o permanente' },
    { palabra: 'MONITOR', pista: 'Pantalla de la computadora' },
    { palabra: 'PROCESADOR', pista: 'El cerebro de la computadora' },
    { palabra: 'VARIABLE', pista: 'Espacio reservado en memoria para guardar un valor' },
    { palabra: 'FUNCION', pista: 'Bloque de código reutilizable que realiza una tarea' },
    { palabra: 'COMPILADOR', pista: 'Traduce código fuente a lenguaje máquina' },
    { palabra: 'LINUX', pista: 'Sistema operativo de código abierto muy usado en servidores' },
    { palabra: 'MINECRAFT', pista: 'Juego de construcción con bloques infinitos' },
    { palabra: 'KIRITO', pista: 'El espadachín negro de Sword Art Online' },
    { palabra: 'POKEMON', pista: 'Monstruos de bolsillo para atrapar y entrenar' },
    { palabra: 'PLAYSTATION', pista: 'Famosa consola de videojuegos desarrollada por Sony' },
    { palabra: 'NINTENDO', pista: 'Compañía creadora de Mario y Zelda' },
    { palabra: 'XBOX', pista: 'Marca de consolas desarrollada por Microsoft' },
    { palabra: 'VALORANT', pista: 'Shooter táctico en primera persona de Riot Games' },
    { palabra: 'FORTNITE', pista: 'Juego Battle Royale muy popular de Epic Games' },
    { palabra: 'OTAKU', pista: 'Persona aficionada al anime y la cultura japonesa' },
    { palabra: 'MANGA', pista: 'Cómic o historieta de origen japonés' },
    { palabra: 'COSPLAY', pista: 'Disfrazarse de un personaje de ficción' },
    { palabra: 'NARUTO', pista: 'Ninja rubio que sueña con ser Hokage' },
    { palabra: 'GOKU', pista: 'Saiyajin criado en la Tierra que protege el universo' },
    { palabra: 'SHINGEKI', pista: 'Anime enfocado en la lucha de la humanidad contra titanes' },
    { palabra: 'ONEPIECE', pista: 'Historia sobre piratas en busca del gran tesoro' },
    { palabra: 'ZELDA', pista: 'Princesa del reino de Hyrule en famosa saga de juegos' },
    { palabra: 'MARIO', pista: 'Fontanero de bigote rojo de Nintendo' },
    { palabra: 'PIKACHU', pista: 'Ratón eléctrico y mascota principal de Pokémon' },
    { palabra: 'STREAMER', pista: 'Persona que transmite en vivo jugando o hablando' },
    { palabra: 'DISCORD', pista: 'Plataforma de voz y texto muy usada por gamers' },
    { palabra: 'MEXICO', pista: 'País famoso por los tacos, el tequila y el mariachi' },
    { palabra: 'ARGENTINA', pista: 'País sudamericano conocido por el tango y el asado' },
    { palabra: 'ESPAÑA', pista: 'País europeo famoso por la paella y el flamenco' },
    { palabra: 'COLOMBIA', pista: 'País famoso por su café de alta calidad' },
    { palabra: 'JAPON', pista: 'País insular del este de Asia conocido como el Sol Naciente' },
    { palabra: 'PIRAMIDE', pista: 'Estructura monumental antigua con base poligonal' },
    { palabra: 'VOLCAN', pista: 'Abertura en la tierra por donde sale lava y ceniza' },
    { palabra: 'OCEANO', pista: 'Gran extensión de agua salada que cubre el planeta' },
    { palabra: 'DESIERTO', pista: 'Zona árida con muy pocas lluvias y mucha arena' },
    { palabra: 'MONTAÑA', pista: 'Gran elevación natural del terreno' },
    { palabra: 'CASCADA', pista: 'Caída grande de agua desde cierta altura' },
    { palabra: 'PLANETA', pista: 'Cuerpo celeste que orbita alrededor de una estrella' },
    { palabra: 'GALAXIA', pista: 'Conjunto enorme de estrellas, polvo y gas' },
    { palabra: 'COMETA', pista: 'Cuerpo celeste congelado que deja una estela de luz' },
    { palabra: 'ECLIPSE', pista: 'Ocultación temporal de un astro por la sombra de otro' },
    { palabra: 'GUITARRA', pista: 'Instrumento musical de seis cuerdas' },
    { palabra: 'BICICLETA', pista: 'Vehículo de dos ruedas impulsado por pedales' },
    { palabra: 'AUTOMOVIL', pista: 'Vehículo de cuatro ruedas con motor' },
    { palabra: 'TELEVISOR', pista: 'Aparato electrónico para ver programas e imágenes' },
    { palabra: 'REFRIGERADOR', pista: 'Electrodoméstico que mantiene fríos los alimentos' },
    { palabra: 'LAMPARA', pista: 'Objeto que sirve para alumbrar un espacio' },
    { palabra: 'ALMOHADA', pista: 'Bolsa blanda que sirve para apoyar la cabeza al dormir' },
    { palabra: 'MICROFONO', pista: 'Aparato que transforma el sonido en señales eléctricas' },
    { palabra: 'ESPEJO', pista: 'Superficie de cristal que refleja la imagen' },
    { palabra: 'CAMISETA', pista: 'Prenda de vestir ligera de manga corta o larga' },
    { palabra: 'ZAPATILLAS', pista: 'Calzado cómodo usado para hacer deporte' },
    { palabra: 'MOCHILA', pista: 'Bolsa para llevar objetos en la espalda' },
    { palabra: 'CUADERNO', pista: 'Conjunto de hojas de papel unidas para escribir' },
    { palabra: 'RELOJ', pista: 'Instrumento para medir el tiempo y dar la hora' },
    { palabra: 'PARAGUAS', pista: 'Objeto que protege de la lluvia' },
    { palabra: 'DINOSAURIO', pista: 'Reptil gigante extinto hace millones de años' },
    { palabra: 'PINGÜINO', pista: 'Ave marina que no vuela y vive en zonas frías' },
    { palabra: 'TIBURON', pista: 'Pez depredador de grandes dientes en el océano' },
    { palabra: 'ELEFANTE', pista: 'El mamífero terrestre más grande del mundo con trompa' },
    { palabra: 'COCODRILO', pista: 'Reptil semiacuático grande de fuertes mandíbulas' },
    { palabra: 'SERPIENTE', pista: 'Reptil sin patas que se desplaza arrastrándose' },
    { palabra: 'JIRAFA', pista: 'Animal terrestre más alto del mundo con cuello largo' },
    { palabra: 'LEON', pista: 'Conocido popularmente como el rey de la selva' },
    { palabra: 'CANGURO', pista: 'Mamífero marsupial de Australia que se desplaza a saltos' },
    { palabra: 'DELFIN', pista: 'Mamífero acuático inteligente famoso por sus saltos' },
    { palabra: 'MARIPOSA', pista: 'Insecto volador con alas de hermosos colores' },
    { palabra: 'AGUILA', pista: 'Ave rapaz de gran tamaño y vista privilegeda' },
    { palabra: 'TIGRE', pista: 'Gran felino de pelaje anaranjado con rayas negras' },
    { palabra: 'MURCIELAGO', pista: 'Único mamífero capaz de volar' },
    { palabra: 'GATO', pista: 'Felino doméstico muy independiente y popular' },
    { palabra: 'CHOCOLATE', pista: 'Dulce hecho a base de cacao y azúcar' },
    { palabra: 'PIZZA', pista: 'Plato italiano a base de masa, tomate y queso' },
    { palabra: 'HAMBURGUESA', pista: 'Pan con carne picada en el centro e ingredientes variados' },
    { palabra: 'ESPAGUETI', pista: 'Tipo de pasta alargada muy popular' },
    { palabra: 'HELADO', pista: 'Postre congelado de leche o agua de diversos sabores' },
    { palabra: 'MANZANA', pista: 'Fruta redonda de color rojo, verde o amarillo' },
    { palabra: 'SANDIA', pista: 'Fruta grande, verde por fuera y roja por dentro' },
    { palabra: 'CERVEZA', pista: 'Bebida alcohólica hecha a base de cebada' },
    { palabra: 'CUPCAKE', pista: 'Pequeño pastel horneado individual con decoración' },
    { palabra: 'ENSALADA', pista: 'Mezcla de hortalizas picadas, frescas y aderezadas' },
    { palabra: 'FUTBOL', pista: 'Deporte donde 11 jugadores buscan meter un balón al arco' },
    { palabra: 'BALONCESTO', pista: 'Deporte donde se encesta un balón en una canasta elevada' },
    { palabra: 'MUSICA', pista: 'Arte de combinar sonidos de forma armoniosa' },
    { palabra: 'PELICULA', pista: 'Obra cinematográfica que cuenta una historia' },
    { palabra: 'CUMPLEAÑOS', pista: 'Aniversario del nacimiento de una persona' }
];


const imagenesAhorcado = [
    `\`\`\`
  +---+
  |   |
      |
      |
      |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
      |
      |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
  |   |
      |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
 /|   |
      |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
========\`\`\``,
    `\`\`\`
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
========\`\`\``
];

const moduleData = {
    games: {
        category: 'Juegos',
        commands: {
            ahorcado: {
                name: 'ahorcado',
                alias: ['hangman', 'letra'],
                group: true,
                run: async (m, { conn, text }) => {
                    try {
                        if (!global.hangman) global.hangman = {};

                        let args = m.text.trim().split(/ +/);
                        let subCommand = args[1] ? args[1].toUpperCase() : '';

                        let juegoActual = global.hangman[m.chat];

                        if (!juegoActual) {
                            let eleccion = palabras[Math.floor(Math.random() * palabras.length)];
                            global.hangman[m.chat] = {
                                palabra: eleccion.palabra,
                                pista: eleccion.pista,
                                oculta: Array(eleccion.palabra.length).fill('_'),
                                intentos: 0,
                                maxIntentos: 6,
                                usadas: []
                            };

                            juegoActual = global.hangman[m.chat];

                            let mensaje = `🎮 *¡JUEGO DEL AHORCADO INICIADO!* 🎮\n\n` +
                                          `${imagenesAhorcado[0]}\n\n` +
                                          `📌 *Palabra:* \`${juegoActual.oculta.join(' ')}\`\n` +
                                          `💡 *Pista:* ${juegoActual.pista}\n\n` +
                                          `───────────────────\n` +
                                          `Escribe \`.ahorcado <letra>\` o \`.letra <letra>\` para jugar.`;

                            return await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });
                        }

                        if (!subCommand) {
                            let mensaje = `🎮 *AHORCADO EN PROCESO* 🎮\n\n` +
                                          `${imagenesAhorcado[juegoActual.intentos]}\n\n` +
                                          `📌 *Palabra:* \`${juegoActual.oculta.join(' ')}\`\n` +
                                          `💡 *Pista:* ${juegoActual.pista}\n` +
                                          `🔤 *Letras usadas:* ${juegoActual.usadas.join(', ') || 'Ninguna'}\n` +
                                          `❤️ *Intentos restantes:* ${juegoActual.maxIntentos - juegoActual.intentos}\n\n` +
                                          `───────────────────\n` +
                                          `Usa \`.ahorcado <letra>\` para adivinar.`;

                            return await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });
                        }

                        if (subCommand.length !== 1 || !/[A-Z]/.test(subCommand)) {
                            return conn.sendMessage(m.chat, { text: '⚠️ Por favor, ingresa solo una letra válida (A-Z).' }, { quoted: m });
                        }

                        if (juegoActual.usadas.includes(subCommand)) {
                            return conn.sendMessage(m.chat, { text: `⚠️ La letra *${subCommand}* ya ha sido intentada.` }, { quoted: m });
                        }

                        juegoActual.usadas.push(subCommand);

                        if (juegoActual.palabra.includes(subCommand)) {
                            for (let i = 0; i < juegoActual.palabra.length; i++) {
                                if (juegoActual.palabra[i] === subCommand) {
                                    juegoActual.oculta[i] = subCommand;
                                }
                            }

                            if (!juegoActual.oculta.includes('_')) {
                                let victoriaMsg = `🎉 *¡FELICIDADES! ¡HAN GANADO!* 🎉\n\n` +
                                                  `La palabra correcta era: *${juegoActual.palabra}*\n` +
                                                  `👤 *Jugador victorioso:* @${m.sender.split('@')[0]}`;

                                delete global.hangman[m.chat];

                                return await conn.sendMessage(m.chat, { text: victoriaMsg, mentions: [m.sender] }, { quoted: m });
                            }

                            let aciertoMsg = `✅ ¡La letra *${subCommand}* es correcta!\n\n` +
                                             `📌 *Palabra:* \`${juegoActual.oculta.join(' ')}\``;

                            return await conn.sendMessage(m.chat, { text: aciertoMsg }, { quoted: m });

                        } else {
                            juegoActual.intentos += 1;

                            if (juegoActual.intentos >= juegoActual.maxIntentos) {
                                let derrotaMsg = `💀 *¡GAME OVER! HAN PERDIDO* 💀\n\n` +
                                                 `${imagenesAhorcado[6]}\n\n` +
                                                 `La palabra secreta era: *${juegoActual.palabra}*`;

                                delete global.hangman[m.chat];

                                return await conn.sendMessage(m.chat, { text: derrotaMsg }, { quoted: m });
                            }

                            let falloMsg = `❌ La letra *${subCommand}* no está en la palabra.\n\n` +
                                           `${imagenesAhorcado[juegoActual.intentos]}\n\n` +
                                           `❤️ *Intentos restantes:* ${juegoActual.maxIntentos - juegoActual.intentos}`;

                            return await conn.sendMessage(m.chat, { text: falloMsg }, { quoted: m });
                        }

                    } catch (err) {
                        await conn.sendMessage(m.chat, { text: `❌ Error en el ahorcado: ${err.message}` }, { quoted: m });
                    }
                }
            }
        }
    }
};

export default moduleData;
