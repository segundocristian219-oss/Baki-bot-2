export const termsCommandConfig = {
    category: 'info',
    commands: {
        terminos: {
            name: 'terminos',
            alias: ['reglas', 'condiciones', 'reglas-subbot', 'terminos-subbot'],
            run: async (m, { conn, command }) => {
                const textGeneral = `REGLAMENTO DE USO GENERAL - SISTEMA DE AUTOMATIZACIÓN\n\nAl interactuar con el bot en grupos o chats privados, usted acepta lo siguiente:\n\n1. USO DEL SERVICIO: El uso de los comandos es gratuito. Se prohíbe el uso de comandos para saturar o atacar la estabilidad del sistema.\n2. COMPORTAMIENTO Y RESPETO: Queda estrictamente prohibido insultar, difamar o atacar la identidad del bot o a su desarrollador. Cualquier falta de respeto resultará en baneo inmediato de toda nuestra infraestructura.\n3. RESPONSABILIDAD: El usuario es el único responsable por el contenido solicitado mediante los comandos disponibles.\n4. ACTUALIZACIÓN DE NORMAS: El administrador puede modificar este reglamento sin previo aviso. El uso continuo del bot implica la aceptación de estas reglas.\n5. RESERVA DE ADMISIÓN: El sistema se reserva el derecho de ignorar o bloquear a usuarios que no cumplan con los estándares de comportamiento establecidos.\n\nEL INCUMPLIMIENTO DE ESTAS NORMAS RESULTARÁ EN LA EXPULSIÓN DE TODA NUESTRA RED DE SERVICIOS.`;

                const textSubbot = `TÉRMINOS Y CONDICIONES DE USO - SISTEMA DE AUTOMATIZACIÓN\n\nEl presente documento establece las normas vinculantes para cualquier usuario que decida vincular su cuenta a nuestro sistema de automatización. El acto de vinculación (escaneo de QR o código de emparejamiento) constituye la aceptación total y sin reservas de los siguientes puntos:\n\n1. NATURALEZA DEL SERVICIO Y PRUEBAS TÉCNICAS\nEl usuario reconoce que accede a un sistema de uso gratuito en fase de desarrollo continuo. Por tanto, el sistema se reserva el derecho de ejecutar pruebas técnicas, despliegue de funciones experimentales y modificaciones estructurales de manera automática y sin previo aviso. Estas acciones son inherentes a la optimización del software y el usuario acepta recibir dichas actualizaciones por el hecho de estar conectado.\n\n2. DESLINDE DE RESPONSABILIDAD DE PLATAFORMA (META/WHATSAPP)\nEste proyecto es una herramienta independiente y NO posee vinculación, asociación, ni autorización legal por parte de WhatsApp Inc., Meta Platforms Inc., ni ninguna de sus filiales. El usuario es plenamente consciente de que el uso de sistemas de automatización de terceros puede contravenir los Términos de Servicio oficiales de WhatsApp. El usuario asume la total responsabilidad por cualquier sanción, suspensión o pérdida de cuenta que la plataforma oficial pueda aplicar, exonerando al desarrollador de este bot de cualquier responsabilidad legal o técnica.\n\n3. PROPIEDAD INTELECTUAL Y PERSONAJE\nSe aclara que el personaje utilizado como identidad visual del sistema (Kazuto Kirigaya / Kirito) es propiedad exclusiva de sus respectivos creadores, autores y estudios de animación. El uso de dicha imagen es con fines recreativos y de personalización dentro del proyecto. El desarrollador no reclama autoría sobre el material artístico original. No se tolerarán conductas hostiles, críticas destructivas o difamación hacia la identidad del sistema; cualquier infracción resultará en la expulsión permanente de la infraestructura.\n\n4. DERECHO DE ADMISIÓN Y MODIFICACIÓN UNILATERAL\nEl acceso al sistema es una concesión voluntaria del desarrollador y no un derecho adquirido. La administración se reserva la facultad de revocar el acceso (bloqueo/baneo) a cualquier usuario por conductas irrespetuosas o por decisión técnica sin previo aviso. Asimismo, estos términos pueden ser actualizados o modificados en cualquier momento para adaptarse a nuevas necesidades legales o técnicas, siendo responsabilidad del usuario revisar la vigencia de los mismos.\n\n5. PRIVACIDAD DE DATOS\nEl sistema cuenta con una arquitectura diseñada para la automatización, garantizando que no existe acceso humano manual a las conversaciones privadas. Sin embargo, el usuario acepta que el bot ejecute acciones sobre la cuenta vinculada según los parámetros programados para su correcto funcionamiento y desarrollo.\n\n6. ACEPTACIÓN DE RIESGOS\nAl ser un servicio gratuito y experimental, el usuario acepta que el software se entrega "tal cual", sin garantías de ningún tipo. La permanencia en el sistema confirma la conformidad legal y absoluta con este reglamento.\n\nSI NO ESTÁ DE ACUERDO CON ESTOS TÉRMINOS, DESCONECTE SU CUENTA DE FORMA INMEDIATA.`;

                if (command === 'reglas' || command === 'condiciones' || command === 'terminos') {
                    await m.react('⏳');
                    await conn.sendMessage(m.chat, { 
                        image: { url: global.img() }, 
                        caption: textGeneral 
                    }, { quoted: m });
                    await m.react('✅');
                }

                if (command === 'reglas-subbot' || command === 'terminos-subbot') {
                    await m.react('⏳');
                    await conn.sendMessage(m.chat, { 
                        image: { url: global.img() },
                        caption: textSubbot 
                    }, { quoted: m });
                    await m.react('✅');
                }
            }
        }
    }
};
