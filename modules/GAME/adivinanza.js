const data = [
  { p: "Si me nombras, desaparezco. ¿Qué soy?", r: ["EL SILENCIO", "SILENCIO"] },
  { p: "Vuelo sin alas, lloro sin ojos. ¿Qué soy?", r: ["LA NUBE", "NUBE", "LAS NUBES", "NUBES"] },
  { p: "Tengo ciudades pero no casas, montañas pero no árboles, y ríos pero no agua. ¿Qué soy?", r: ["UN MAPA", "MAPA", "EL MAPA"] },
  { p: "Siempre estoy en camino, pero nunca llego. ¿Qué soy?", r: ["EL MAÑANA", "MAÑANA", "EL FUTURO", "FUTURO"] },
  { p: "Cuanto más hay, menos ves. ¿Qué soy?", r: ["LA OSCURIDAD", "OSCURIDAD"] },
  { p: "Paso por el agua y no me mojo, paso por el fuego y no me quemo. ¿Qué soy?", r: ["LA SOMBRA", "SOMBRA"] },
  { p: "No tengo voz, pero te hablo. No tengo alma, pero te enseño. ¿Qué soy?", r: ["UN LIBRO", "LIBRO", "EL LIBRO"] },
  { p: "Rompo al decir mi nombre. ¿Qué soy?", r: ["EL SILENCIO", "SILENCIO"] },
  { p: "Me puedes sostener en tu mano derecha, pero jamás en tu mano izquierda. ¿Qué soy?", r: ["TU CODO IZQUIERDO", "CODO IZQUIERDO", "EL CODO IZQUIERDO"] },
  { p: "Nazco grande y muero pequeña. ¿Qué soy?", r: ["UNA VELA", "VELA", "LA VELA"] },
  { p: "Te pertenezco a ti, pero los demás lo usan mucho más que tú. ¿Qué es?", r: ["TU NOMBRE", "NOMBRE", "EL NOMBRE"] },
  { p: "Tengo un solo ojo, pero no puedo ver nada. ¿Qué soy?", r: ["UNA AGUJA", "AGUJA", "LA AGUJA"] },
  { p: "Tengo llaves pero no abro cerrojos, tengo espacio pero no hay cuartos, puedo entrar pero no salir. ¿Qué soy?", r: ["UN TECLADO", "TECLADO", "EL TECLADO"] },
  { p: "Corro pero no tengo piernas, murmuro pero no tengo boca. ¿Qué soy?", r: ["UN RIO", "RIO", "EL RIO"] },
  { p: "Subo y bajo, pero me quedo en el mismo lugar. ¿Qué soy?", r: ["LA ESCALERA", "ESCALERA", "LAS ESCALERAS", "ESCALERAS", "UNA ESCALERA"] },
  { p: "Puedo viajar por todo el mundo sin salir de mi esquina. ¿Qué soy?", r: ["UN SELLO", "SELLO", "EL SELLO", "ESTAMPILLA", "UNA ESTAMPILLA"] },
  { p: "No me puedes comprar ni vender, pero si me pierdes no me puedes recuperar. ¿Qué soy?", r: ["EL TIEMPO", "TIEMPO"] },
  { p: "Tengo un cuello pero no tengo cabeza. ¿Qué soy?", r: ["UNA BOTELLA", "BOTELLA", "LA BOTELLA"] },
  { p: "Mientras más caliente me pongo, más fresco parezco. ¿Qué soy?", r: ["EL PAN", "PAN", "UN PAN"] },
  { p: "Si me tienes, quieres compartirme. Si me compartes, ya no me tienes. ¿Qué soy?", r: ["UN SECRETO", "SECRETO", "EL SECRETO"] },
  { p: "Llego sin ser visto, me voy sin ser tocado, y a veces asusto sin haber hablado. ¿Qué soy?", r: ["EL VIENTO", "VIENTO"] },
  { p: "Aunque tengo muchos dientes, nunca puedo morder. ¿Qué soy?", r: ["UN PEINE", "PEINE", "EL PEINE"] },
  { p: "Entro seco y duro, pero salgo blando y mojado. ¿Qué soy?", r: ["EL CHICLE", "CHICLE", "UN CHICLE"] },
  { p: "Parezco un instrumento pero marco el compás de tus días. Si me detengo, nadie camina igual. ¿Qué soy?", r: ["EL RELOJ", "RELOJ", "UN RELOJ"] },
  { p: "Llevo años en el mar y nunca aprendí a nadar. ¿Qué soy?", r: ["UN ANCLA", "ANCLA", "EL ANCLA"] }
];

const correctMsgs = [
  "¡Impresionante! Le diste justo en el blanco. 🎉",
  "¡Eso es! Tu inteligencia no deja de sorprender. ✨",
  "¡Correcto! Sabía que tenías la respuesta. 🧠",
  "¡Excelente deducción! Has resuelto el acertijo. 🎯"
];

const wrongMsgs = [
  "Esa no es la respuesta. ¡Sigue intentando!",
  "Mmm... cerca pero no. Inténtalo otra vez.",
  "Respuesta incorrecta. No te rindas.",
  "¡Negativo! Piensa un poco más."
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const cleanText = (text) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .toUpperCase();
};

export const adivinanzaCommand = {
    category: 'game',
    commands: {
        adivinanza: {
            name: 'adivinanza',
            alias: ['riddle', 'acertijo'],
            async before(m, { conn }) {
                global.riddleGames = global.riddleGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.riddleGames[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const userTextClean = cleanText(m.text || '');

                const isCorrect = game.respuestasValidas.some(res => cleanText(res) === userTextClean);

                if (isCorrect) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `*» ADIVINANZA RESUELTA*\n` +
                              `*» Estado* : ${getRandom(correctMsgs)}\n` +
                              `*» Solución* : ${game.solucionPrincipal}`
                    }, { quoted: m });
                    delete global.riddleGames[gameId];
                    return true;
                }

                game.intentos -= 1;

                if (game.intentos > 0) {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, {
                        text: `*» RESPUESTA INCORRECTA*\n` +
                              `*» Detalle* : ${getRandom(wrongMsgs)}\n` +
                              `*» Te quedan* : ${game.intentos} intento(s)\n` +
                              `• Vuelve a responder a este mensaje.`
                    }, { quoted: m });
                } else {
                    await m.react('💀');
                    await conn.sendMessage(m.chat, {
                        text: `*» JUEGO TERMINADO*\n` +
                              `*» Estado* : Agotaste tus 3 intentos ❌\n` +
                              `*» Solución Correcta* : ${game.solucionPrincipal}`
                    }, { quoted: m });
                    delete global.riddleGames[gameId];
                }

                return true;
            },
            run: async (m, { conn }) => {
                global.riddleGames = global.riddleGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.riddleGames[gameId]) {
                    return conn.sendMessage(m.chat, { 
                        text: `*» ALERTA* : Ya tienes una adivinanza activa. Responde al mensaje anterior.` 
                    }, { quoted: m });
                }

                let lastIndex = global.lastRiddleIndex || -1;
                let randomIndex;
                do { randomIndex = Math.floor(Math.random() * data.length); }
                while (randomIndex === lastIndex && data.length > 1);

                global.lastRiddleIndex = randomIndex;
                const reto = data[randomIndex];

                const texto = `*» SISTEMA DE ADIVINANZAS «*\n\n` +
                              `*» Pregunta* : ${reto.p}\n\n` +
                              `• Responde directamente a este mensaje con tu respuesta.\n` +
                              `• Tienes *3 intentos*.`;

                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                const respuestasArray = Array.isArray(reto.r) ? reto.r : [reto.r];

                global.riddleGames[gameId] = { 
                    respuestasValidas: respuestasArray, 
                    solucionPrincipal: respuestasArray[0],
                    intentos: 3, 
                    msgId: enviado.key.id 
                };
                return true;
            }
        }
    }
};
