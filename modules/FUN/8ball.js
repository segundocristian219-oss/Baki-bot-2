import { createCanvas } from '@napi-rs/canvas';

const respuestasCubo = [
    "Es cierto.",
    "Definitivamente asi es.",
    "Sin duda alguna.",
    "Si, definitivamente.",
    "Puedes confiar en ello.",
    "Segun lo veo, si.",
    "Es lo mas probable.",
    "Las perspectivas son buenas.",
    "Si.",
    "Las senales apuntan a que si.",
    "Respuesta vaga, prueba otra vez.",
    "Pregunta de nuevo mas tarde.",
    "Mejor no decirte ahora.",
    "No puedo predecirlo ahora.",
    "Concentrate y pregunta otra vez.",
    "No cuentes con ello.",
    "Mi respuesta es no.",
    "Mis fuentes dicen que no.",
    "Las perspectivas no son buenas.",
    "Muy dudoso."
];

export const eightBallModule = {
    category: 'fun',
    commands: {
        eightball: {
            name: '8ball',
            alias: ['oraculo', 'cubo', 'preguntar'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                try {
                    if (!text) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} <pregunta>`);
                    }

                    await m.react('🔮');

                    const respuestaRaw = respuestasCubo[Math.floor(Math.random() * respuestasCubo.length)];
                    const respuesta = respuestaRaw.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                    const canvas = createCanvas(600, 600);
                    const ctx = canvas.getContext('2d');

                    const bgGlow = ctx.createRadialGradient(300, 300, 50, 300, 300, 300);
                    bgGlow.addColorStop(0, '#1a0933');
                    bgGlow.addColorStop(0.7, '#0d041a');
                    bgGlow.addColorStop(1, '#05010a');
                    ctx.fillStyle = bgGlow;
                    ctx.fillRect(0, 0, 600, 600);

                    const orbGlow = ctx.createRadialGradient(280, 260, 20, 300, 300, 220);
                    orbGlow.addColorStop(0, '#9d4edd');
                    orbGlow.addColorStop(0.5, '#5a189a');
                    orbGlow.addColorStop(0.85, '#240046');
                    orbGlow.addColorStop(1, '#10002b');

                    ctx.shadowColor = '#c77dff';
                    ctx.shadowBlur = 30;
                    ctx.beginPath();
                    ctx.arc(300, 300, 210, 0, Math.PI * 2);
                    ctx.fillStyle = orbGlow;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    const triTopY = 210;
                    const triBottomY = 420;

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(300, triBottomY);
                    ctx.lineTo(170, triTopY);
                    ctx.lineTo(430, triTopY);
                    ctx.closePath();

                    const triangleGradient = ctx.createLinearGradient(300, triTopY, 300, triBottomY);
                    triangleGradient.addColorStop(0, '#10002b');
                    triangleGradient.addColorStop(1, '#3c096c');
                    ctx.fillStyle = triangleGradient;
                    ctx.fill();

                    ctx.strokeStyle = '#e0aaff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.restore();

                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = '#e0aaff';
                    ctx.shadowBlur = 10;

                    const words = respuesta.split(' ');
                    let fontSize = 22;
                    let lines = [];

                    while (fontSize >= 10) {
                        ctx.font = `bold ${fontSize}px sans-serif`;
                        lines = [];
                        let currentLine = words[0];

                        for (let i = 1; i < words.length; i++) {
                            let testWidth = ctx.measureText(currentLine + " " + words[i]).width;
                            if (testWidth < 160) {
                                currentLine += " " + words[i];
                            } else {
                                lines.push(currentLine);
                                currentLine = words[i];
                            }
                        }
                        lines.push(currentLine);

                        let totalHeight = lines.length * (fontSize * 1.25);
                        let maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));

                        if (totalHeight <= 120 && maxWidth <= 170) {
                            break;
                        }
                        fontSize -= 1;
                    }

                    const lineSpacing = fontSize * 1.25;
                    const centerY = triTopY + 70;
                    let startY = centerY - ((lines.length - 1) * (lineSpacing / 2));

                    lines.forEach((line, index) => {
                        ctx.fillText(line, 300, startY + (index * lineSpacing));
                    });

                    const imageBuffer = await canvas.toBuffer('image/png');

                    const captionText = `• *Pregunta:* ${text}`;

                    await conn.sendMessage(m.chat, {
                        image: imageBuffer,
                        caption: captionText
                    }, { quoted: m });

                    await m.react('✅');

                } catch (error) {
                    console.error('Error en el comando 8ball:', error);
                    await m.react('❌');
                    m.reply(`> Error al procesar la respuesta: ${error.message}`);
                }
            }
        }
    }
};