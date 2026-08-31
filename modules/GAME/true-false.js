const data = [
  // --- Preguntas de la base original ---
  { p: "El corazón de un camarón está en su cabeza.", r: "VERDADERO", nota: "Se encuentra en el cefalotórax, la fusión de la cabeza y el tórax." },
  { p: "Los seres humanos pueden respirar y tragar al mismo tiempo.", r: "FALSO", nota: "La epiglotis sella las vías respiratorias al tragar para evitar ahogamientos." },
  { p: "Las abejas pueden reconocer rostros humanos.", r: "VERDADERO", nota: "Utilizan un tipo de procesamiento visual combinado similar al de los humanos." },
  { p: "El Monte Everest es la montaña más alta respecto al centro de la Tierra.", r: "FALSO", nota: "El Volcán Chimborazo en Ecuador está más alejado del centro por el ensanchamiento ecuatorial." },
  { p: "Un día en Venus es más largo que un año en Venus.", r: "VERDADERO", nota: "Venus tarda 243 días terrestres en rotar sobre sí mismo, pero 225 días en dar la vuelta al Sol." },
  { p: "Los pulpos tienen tres corazones.", r: "VERDADERO", nota: "Dos bombean sangre a las branquias y el tercero al resto del cuerpo." },
  { p: "El oro es comestible para los seres humanos.", r: "VERDADERO", nota: "El oro puro de 24 quilates es biológicamente inerte y no es absorbido por el cuerpo." },
  { p: "Los toros ven el color rojo y por eso se enojan.", r: "FALSO", nota: "Son dicromáticos y no distinguen el rojo; reaccionan únicamente al movimiento de la capa." },
  { p: "Las jirafas no tienen cuerdas vocales.", r: "FALSO", nota: "Sí tienen, pero emiten sonidos infrasónicos inaudibles para los humanos." },
  { p: "Los plátanos crecen en árboles.", r: "FALSO", nota: "La planta del plátano es una megaforbia (hierba gigante), carece de un tronco leñoso real." },
  { p: "El sonido viaja más rápido en el agua que en el aire.", r: "VERDADERO", nota: "Al ser un medio más denso, el agua transmite las ondas sonoras casi 4 veces más rápido." },
  { p: "Los humanos comparten aproximadamente el 60% de su ADN con los plátanos.", r: "VERDADERO", nota: "Se debe a los genes esenciales de mantenimiento celular que comparten casi todos los seres vivos." },
  { p: "Australia es un continente y un país al mismo tiempo.", r: "VERDADERO", nota: "Es el único país que ejerce soberanía sobre una masa continental completa." },
  { p: "El sol es una estrella de color azul.", r: "FALSO", nota: "Es de tipo G y emite luz blanca pura, la cual percibimos amarilla por la atmósfera." },
  { p: "Las mariposas saborean con sus pies.", r: "VERDADERO", nota: "Poseen quimiorreceptores en sus patas para analizar los nutrientes de las plantas." },
  { p: "El ojo del avestruz es más grande que su cerebro.", r: "VERDADERO", nota: "Mide unos 5 cm de diámetro, ocupando la mayor parte del espacio craneal." },
  { p: "La Gran Muralla China es visible desde la Luna a simple vista.", r: "FALSO", nota: "Es un mito; su ancho es minúsculo y se camufla con la topografía terrestre." },
  { p: "El agua caliente puede congelarse más rápido que la fría.", r: "VERDADERO", nota: "Fenómeno conocido como Efecto Mpemba, acelerado por convección y evaporación." },
  { p: "Las huellas dactilares de los koalas se confunden con las humanas.", r: "VERDADERO", nota: "Sus crestas dactilares son casi indistinguibles bajo microscopio." },
  { p: "El sonido no puede propagarse en el espacio exterior.", r: "VERDADERO", nota: "Al ser un vacío mecánico, no existen partículas para transmitir las ondas." },
  { p: "La Torre Eiffel puede crecer hasta 15 cm en verano.", r: "VERDADERO", nota: "El hierro de la estructura experimenta expansión térmica con altas temperaturas." },
  { p: "Los relámpagos nunca caen dos veces en el mismo lugar.", r: "FALSO", nota: "Edificios altos como el Empire State reciben decenas de impactos cada año." },
  { p: "Los camellos almacenan agua pura en sus jorobas.", r: "FALSO", nota: "Almacenan tejido graso que luego metabolizan para obtener energía y agua." },
  { p: "El desierto más grande del mundo es el Sáhara.", r: "FALSO", nota: "La Antártida es el desierto más grande del planeta por sus escasísimas precipitaciones." },
  { p: "Las uñas de las manos crecen más rápido que las de los pies.", r: "VERDADERO", nota: "Reciben mayor flujo sanguíneo y estímulo mecánico continuo." },

  // --- Preguntas adicionales ---
  { p: "Las moscas domésticas viven en promedio solo 24 horas.", r: "FALSO", nota: "Las moscas comunes viven entre 15 y 30 días si el clima es favorable." },
  { p: "El café está hecho a partir de la semilla de una fruta.", r: "VERDADERO", nota: "Los granos de café son las semillas que se extraen de la cereza del cafeto." },
  { p: "Los tiburones son mamíferos marinos.", r: "FALSO", nota: "Son peces cartilaginosos; respiran por branquias y no amamantan a sus crías." },
  { p: "Cleopatra vivió más cerca de la invención del iPhone que de la Gran Pirámide.", r: "VERDADERO", nota: "La Gran Pirámide se construyó c. 2560 a.C., Cleopatra vivió c. 30 a.C. y el iPhone salió en 2007." },
  { p: "Un rayo contiene suficiente energía para tostar 100,000 rebanadas de pan.", r: "VERDADERO", nota: "Descarga más de 5,000 millones de julios de energía en una fracción de segundo." },
  { p: "Los pingüinos habitan únicamente en el Polo Norte.", r: "FALSO", nota: "Viven exclusivamente en el hemisferio sur, ninguno habita el Polo Norte nativamente." },
  { p: "El diamante está compuesto únicamente por carbono.", r: "VERDADERO", nota: "Es una forma alotrópica del carbono cristalizado bajo presiones extremas." },
  { p: "Los gatos no pueden detectar el sabor dulce.", r: "VERDADERO", nota: "Carecen de la proteína del gen receptor de sabor dulce funcional." },
  { p: "La miel pura nunca se echa a perder.", r: "VERDADERO", nota: "Su baja humedad y alta acidez crean un entorno inviable para las bacterias." },
  { p: "El cerebro humano consume alrededor del 20% de la energía del cuerpo.", r: "VERDADERO", nota: "A pesar de representar solo el 2% del peso corporal, requiere el 20% de la energía metabólica." },
  { p: "Los dientes son considerados huesos.", r: "FALSO", nota: "Están hechos de esmalte, dentina y pulpa; no se regeneran ni producen médula como los huesos." },
  { p: "La Antártida es el único continente sin reptiles ni serpientes.", r: "VERDADERO", nota: "El frío extremo impide que animales de sangre fría sobrevivan allí." },
  { p: "Los flamingos son blancos al nacer.", r: "VERDADERO", nota: "Nacen con plumaje gris/blanco y adquieren su color rosa al comer carotenoides de los camarones." },
  { p: "El motor de combustión se inventó antes que la bicicleta.", r: "FALSO", nota: "La bicicleta moderna nació en 1817; los motores de combustión llegaron décadas después." },
  { p: "La piel es el órgano más grande del cuerpo humano.", r: "VERDADERO", nota: "Cubre toda la superficie corporal externa representando cerca del 16% de la masa del cuerpo." }
];

export const trueFalseCommand = {
    category: 'game',
    commands: {
        verdaderofalso: {
            name: 'verdaderofalso',
            alias: ['vf', 'truefalse', 'kirito'],
            async before(m, { conn }) {
                global.vfGames = global.vfGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.vfGames[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const txt = (m.text || '').trim().toUpperCase();
                const esVerdadero = txt === 'V' || txt === 'VERDADERO';
                const esFalso = txt === 'F' || txt === 'FALSO';
                if (!esVerdadero && !esFalso) return false;

                if ((esVerdadero && game.respuesta === 'VERDADERO') || (esFalso && game.respuesta === 'FALSO')) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `*» RESULTADO DE LA TRIVIA*\n` +
                              `*» Estado* : ¡Respuesta Correcta! 🎉\n` +
                              `*» Solución* : ${game.respuesta}\n` +
                              `*» Dato Curioso* : ${game.nota}`
                    }, { quoted: m });
                } else {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, {
                        text: `*» RESULTADO DE LA TRIVIA*\n` +
                              `*» Estado* : Respuesta Incorrecta ❌\n` +
                              `*» Solución Correcta* : ${game.respuesta}\n` +
                              `*» Explicación* : ${game.nota}`
                    }, { quoted: m });
                }

                delete global.vfGames[gameId];
                return true;
            },
            run: async (m, { conn }) => {
                global.vfGames = global.vfGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.vfGames[gameId]) {
                    return conn.sendMessage(m.chat, { 
                        text: `*» ALERTA* : Ya tienes una trivia activa. Responde con *V* o *F* al mensaje anterior.` 
                    }, { quoted: m });
                }

                let lastIndex = global.lastVfIndex || -1;
                let randomIndex;
                do { randomIndex = Math.floor(Math.random() * data.length); }
                while (randomIndex === lastIndex && data.length > 1);

                global.lastVfIndex = randomIndex;
                const reto = data[randomIndex];

                const texto = `*» SISTEMA DE TRIVIA «*\n\n` +
                              `*» Pregunta* : ${reto.p}\n\n` +
                              `• Responde directamente a este mensaje con:\n` +
                              `• *V* : Verdadero\n` +
                              `• *F* : Falso`;

                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.vfGames[gameId] = { respuesta: reto.r, nota: reto.nota, msgId: enviado.key.id };
                return true;
            }
        }
    }
};
