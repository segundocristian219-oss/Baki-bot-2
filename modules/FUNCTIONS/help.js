import { readFileSync } from 'fs';
import { join } from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fetch from 'node-fetch';

const pkgPath = join(process.cwd(), 'package.json');
let pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

let cachedTotalReg = 0;
let cachedTotalChats = 0;

function getTotalCommands() {
    return global.commands ? global.commands.size : 0;
}

const getBotName = (conn) => (typeof name === 'function' ? name(conn) : (conn?.user?.name || 'Bot'));
const getBotImg = () => (typeof img === 'function' ? img() : null);
const getDeveloperName = () => (typeof developer !== 'undefined' ? developer : 'Developer');

async function getOptimizedThumbnail(source) {
    if (!source) return Buffer.alloc(0);
    try {
        let inputBuffer;
        if (Buffer.isBuffer(source)) {
            inputBuffer = source;
        } else if (typeof source === 'string' && source.startsWith('http')) {
            const res = await fetch(source);
            if (!res.ok) return Buffer.alloc(0);
            const arrayBuffer = await res.arrayBuffer();
            inputBuffer = Buffer.from(arrayBuffer);
        } else {
            return Buffer.alloc(0);
        }

        const resizedBuffer = await sharp(inputBuffer)
            .resize(300, 220, { fit: 'cover' })
            .toFormat('jpeg', { quality: 70 })
            .toBuffer();

        return resizedBuffer;
    } catch (e) {
        return Buffer.alloc(0);
    }
}

export const menuCommand = {
    category: 'main',
    commands: {
        help: {
            name: 'menu',
            alias: ['help', 'comandos', 'h'],
            run: async (m, { conn, text }) => {
                try {
                    let uptime = clockString(process.uptime() * 1000);
                    const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇ模 V5.8.0';

                    const botJid = conn.user ? jidNormalizedUser(conn.user.id) : '';

                    const senderJid = m.sender || '';
                    const senderNum = senderJid ? senderJid.split('@')[0] : 'Usuario';

                    let menuText1 = `\n〔 Hello, my name is ${getBotName(conn)} 〕\n`;
                    menuText1 += `➥ ⋄ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 : @${senderNum}\n`;
                    menuText1 += `➥ ⋄ 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜: ${getTotalCommands()}\n`;
                    menuText1 += `➥ ⋄ 𝚄𝚙𝚝𝚒𝚖𝚎  : ${uptime}\n`;
                    menuText1 += `➥ ⋄ 𝚅𝚎𝚛𝚜𝚒𝚘́𝚗  : ${pkg.version}\n`;
                    menuText1 += `> www.dynlayer.xyz`;

                    menuText1 += `\n`;
                    let menuText = `${rmrText}\n\n`;

                    const categories = {};
                    if (global.commands) {
                        for (const [_, cmd] of global.commands.entries()) {
                            const cat = (cmd.category || 'general').toUpperCase();
                            if (cat === 'OWNER' || cat === 'PRUEBA' || (cmd.folder && cmd.folder.toUpperCase() === 'PRUEBAS')) continue;
                            if (!categories[cat]) categories[cat] = new Set();

                            let cmdDisplay = cmd.name;
                            if (cmd.alias && Array.isArray(cmd.alias) && cmd.alias.length > 0) {
                                cmdDisplay += ` (${cmd.alias.join(', ')})`;
                            }
                            categories[cat].add(cmdDisplay);
                        }
                    }

                    
                    const query = (text || '').trim().toUpperCase();
                    if (query && categories[query]) {
                        menuText += `┌──「 *${query}* 」──\n`;
                        categories[query].forEach(cmdStr => { menuText += `┃ ♛ *${cmdStr}*\n`; });
                        menuText += `└───────────────\n\n`;
                    } else {
                        for (const [title, cmds] of Object.entries(categories)) {
                            menuText += `┌──「 *${title}* 」──\n`;
                            cmds.forEach(cmdStr => { menuText += `┃ ♛ *${cmdStr}*\n`; });
                            menuText += `└───────────────\n\n`;
                        }
                    }

                    menuText += `> © Powered by ${getDeveloperName()}.`;

                    let rawBotImg = getBotImg();
                    let thumbnailBuffer = await getOptimizedThumbnail(rawBotImg);

                    const rawPayload = {
                        buttonsMessage: {
                            contentText: menuText1,
                            footerText: menuText,
                            headerType: 6,
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                url: typeof global.surl === 'function' ? global.surl() : 'https://whatsapp.com',
                                name: getBotName(conn),
                                address: typeof developer !== 'undefined' ? developer : 'Developer',
                                jpegThumbnail: thumbnailBuffer
                            },
                            contextInfo: {
                                ...(global.channelInfo || {}),
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardOrigin: "UNKNOWN",
                                mentionedJid: [m.sender]
                            }
                        }
                    };

                    await conn.relayMessage(m.chat, rawPayload, { quoted: m });

                } catch (error) {
                    const errorReport = `❌ *REPORT DE ERROR INTERNO*\n\n` +
                                        `• *Módulo:* help.js\n` +
                                        `• *Comando:* menu\n` +
                                        `• *Error:* ${error.message}\n\n` +
                                        `*Trazado de la pila (Stack):*\n\`\`\`${error.stack}\`\`\``;

                    try {
                        await conn.sendMessage(m.chat, { text: errorReport }, { quoted: m });
                    } catch (sendError) {
                        console.error('Incapaz de transmitir el reporte de error al chat de origen:', sendError);
                    }
                }
            }
        }
    }
};

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
