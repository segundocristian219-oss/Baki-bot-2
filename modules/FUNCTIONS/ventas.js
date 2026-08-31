export const ventasCommand = {
    category: 'tienda',
    commands: {
        ventas: {
            name: 'ventas',
            alias: ['comprar', 'planes', 'alquilar', 'asistente'],
            libre: true,
            run: async function (m, { conn }) {
                const i = global.img(conn);

                const textoVentas = `🛒 *ASISTENTE DE VENTAS - KIRITO BOT NETWORK*\n\n` +
                    `Hola. Soy el asistente de ventas. Aquí tienes nuestras opciones de servidores de alojamiento mensual:\n\n` +
                    `🔹 *[01] SERVIDOR BASE*\n` +
                    `• *Descripción:* Servidor decente y estable para uso regular.\n` +
                    `• *Duración:* 1 Mes\n` +
                    `• *Precio:* $7 USD\n\n` +
                    `🔸 *[02] SERVIDOR POTENTE*\n` +
                    `• *Descripción:* Servidor de mayor capacidad para procesos exigentes.\n` +
                    `• *Duración:* 1 Mes\n` +
                    `• *Precio:* $13 USD\n\n` +
                    `➔ _Selecciona una opción abajo para generar tu enlace de pago, ver la oferta de primera compra o contactar a ventas._`;

                const botones = [
                    { text: '💳 Pagar Precio Normal', id: '.pagar_normal' },
                    { text: '🔥 Oferta Primera Compra', id: '.oferta_primera' },
                    { text: '💬 Hablar con un Humano', url: 'https://wa.me/50432955554?text=Hola,%20necesito%20ayuda%20con%20los%20servidores' }
                ];

                const opciones = {
                    title: "亗  SERVIDORES DISPONIBLES  亗",
                    footer: "Kirito-Bot MD • Network",
                    quoted: m,
                    image: i
                };

                try {
                    await conn.sendButtonMessage(m.chat, textoVentas, botones, opciones);
                } catch (err) {
                    await m.reply("Error en la ejecución del comando de ventas:\n\n" + err.message);
                }
            }
        },
        pagar_normal: {
            name: 'pagar_normal',
            alias: ['pagarnormal'],
            run: async function (m, { conn }) {
                const i = global.img(conn);

                const textoPagos = `💳 *PASARELA DE PAGO - PRECIO REGULAR*\n\n` +
                    `Haz clic en el botón del servidor que deseas alquilar por un mes. Serás redirigido a la pasarela de pago segura.`;

                const botones = [
                    { text: '🛒 Servidor Base ($7)', url: 'https://dix.lat/pay?7&p=servidor_base' },
                    { text: '🚀 Servidor Potente ($13)', url: 'https://dix.lat/pay?13&p=servidor_potente' },
                    { text: '⬅️ Volver al Menú', id: '.ventas' }
                ];

                const opciones = {
                    title: "亗  GENERADOR DE PAGOS  亗",
                    footer: "Kirito-Bot MD • Network",
                    quoted: m,
                    image: i
                };

                try {
                    await conn.sendButtonMessage(m.chat, textoPagos, botones, opciones);
                } catch (err) {
                    await m.reply("Error en la ejecución del generador de pagos:\n\n" + err.message);
                }
            }
        },
        oferta_primera: {
            name: 'oferta_primera',
            alias: ['ofertas', 'promos'],
            run: async function (m, { conn }) {
                const i = global.img(conn);

                const textoOfertas = `🔥 *OFERTA EXCLUSIVA - PRIMERA COMPRA*\n\n` +
                    `¡Solo por tu primera compra y si pagas en este momento, llévate los servidores con descuento mensual!\n\n` +
                    `⚡ *SERVIDOR BASE (OFERTA)*\n` +
                    `• *Precio Oferta:* $5 USD (Precio normal $7 USD)\n\n` +
                    `🚀 *SERVIDOR POTENTE (OFERTA)*\n` +
                    `• *Precio Oferta:* $10 USD (Precio normal $13 USD)\n\n` +
                    `➔ _Haz clic en el botón correspondiente para pagar ahora mismo con el descuento aplicado._`;

                const botones = [
                    { text: '⚡ Pagar Base ($5)', url: 'https://dix.lat/pay?5&p=oferta_servidor_base' },
                    { text: '🚀 Pagar Potente ($10)', url: 'https://dix.lat/pay?10&p=oferta_servidor_potente' },
                    { text: '⬅️ Volver al Menú', id: '.ventas' }
                ];

                const opciones = {
                    title: "亗  OFERTA DE BIENVENIDA  亗",
                    footer: "Kirito-Bot MD • Network",
                    quoted: m,
                    image: i
                };

                try {
                    await conn.sendButtonMessage(m.chat, textoOfertas, botones, opciones);
                } catch (err) {
                    await m.reply("Error en la ejecución del comando de ofertas:\n\n" + err.message);
                }
            }
        }
    }
};


