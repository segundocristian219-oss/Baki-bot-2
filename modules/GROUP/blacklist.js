import { getRealJid } from '../../core/identifier.js';


function extraerNumero(m, args) {
    if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0].split('@')[0];
    if (m.quoted && m.quoted.sender) return m.quoted.sender.split('@')[0];
    if (args[0]) return args[0].replace(/[^0-9]/g, '');
    return null;
}

function extraerJidCrudo(m, args) {
    if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0];
    if (m.quoted && m.quoted.sender) return m.quoted.sender;
    if (args[0]) return `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    return null;
}

function esOwner(numero) {
    if (!global.owner) return false;
    return global.owner.some(ownerItem => {
        if (!ownerItem) return false;
        if (Array.isArray(ownerItem)) return ownerItem[0] ? ownerItem[0].replace(/\D/g, '') === numero : false;
        if (typeof ownerItem === 'string') return ownerItem.replace(/\D/g, '') === numero;
        return false;
    });
}

export const BlacklistGroupModule = {
    category: 'group',
    commands: {
        1: {
            name: 'black',
            alias: ['blacklist', 'ban'],
            owner: true, // Mantiene la restricción solo para creadores/owners
            run: async function (m, { conn, args }) {
                const jidCrudo = extraerJidCrudo(m, args);
                const numero = extraerNumero(m, args);

                if (!jidCrudo || !numero) {
                    return m.reply('❌ Menciona a un usuario, responde su mensaje o escribe el número.\n\n*Ejemplo:* .black @usuario motivo');
                }

                if (esOwner(numero)) {
                    return m.reply('❌ No puedes agregar a un owner del bot a la blacklist.');
                }

                const realJid = await getRealJid(conn, jidCrudo, m).catch(() => jidCrudo);

                // Extracción limpia del motivo ignorando la mención/número
                let rawText = args.join(' ');
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    m.mentionedJid.forEach(jid => {
                        const num = jid.split('@')[0];
                        rawText = rawText.replace(new RegExp(`@?${num}`, 'g'), '');
                    });
                } else if (args[0] && args[0].replace(/\D/g, '') === numero) {
                    rawText = args.slice(1).join(' ');
                }
                const motivo = rawText.trim() || 'Sin motivo especificado';

                const existente = await global.User.findOne({
                    $or: [{ id: realJid }, { lid: realJid }]
                }).catch(() => null);

                if (existente?.banned) {
                    return m.reply(`⚠️ *${numero}* ya está en la blacklist.`);
                }

                await global.User.findOneAndUpdate(
                    { $or: [{ id: realJid }, { lid: realJid }] },
                    { $set: { id: realJid, banned: true, banReason: motivo } },
                    { upsert: true }
                );

                if (global.userCache) global.userCache.delete(realJid);

                const grupos = await conn.groupFetchAllParticipating().catch(() => ({}));
                const gruposArray = Object.values(grupos || {});
                const botNumero = conn.user?.id?.split(':')[0].replace(/\D/g, '');

                let expulsado = 0;
                let fallido = 0;

                for (const grupo of gruposArray) {
                    const objetivo = grupo.participants.find(p => {
                        const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
                        return pNum === numero;
                    });
                    if (!objetivo) continue;

                    const botParticipant = grupo.participants.find(p => {
                        const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
                        return pNum === botNumero;
                    });
                    const botEsAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin' || botParticipant.isAdmin || botParticipant.isSuperAdmin);

                    if (!botEsAdmin) {
                        fallido++;
                        continue;
                    }

                    try {
                        await conn.groupParticipantsUpdate(grupo.id, [objetivo.id], 'remove');
                        expulsado++;
                    } catch {
                        fallido++;
                    }
                }

                let reporte = `🚫 *USUARIO AGREGADO A LA BLACKLIST*\n\n`;
                reporte += `• *Número:* ${numero}\n`;
                reporte += `• *Motivo:* ${motivo}\n`;
                reporte += `• *Expulsado de:* ${expulsado} grupo(s)\n`;
                if (fallido > 0) reporte += `• *Sin expulsar:* ${fallido} grupo(s) (falta admin)\n`;
                reporte += `\nEste usuario no podrá interactuar con el bot.`;

                return m.reply(reporte);
            }
        },
        2: {
            name: 'unblack',
            alias: ['unblacklist', 'unban'],
            owner: true, // Mantiene la restricción solo para creadores/owners
            run: async function (m, { conn, args }) {
                const jidCrudo = extraerJidCrudo(m, args);
                const numero = extraerNumero(m, args);

                if (!jidCrudo || !numero) {
                    return m.reply('❌ Menciona a un usuario, responde su mensaje o escribe el número.\n\n*Ejemplo:* .unblack @usuario');
                }

                const realJid = await getRealJid(conn, jidCrudo, m).catch(() => jidCrudo);

                const resultado = await global.User.findOneAndUpdate(
                    { $or: [{ id: realJid }, { lid: realJid }], banned: true },
                    { $set: { banned: false, banReason: null } }
                );

                if (!resultado) {
                    return m.reply(`⚠️ *${numero}* no está registrado en la blacklist.`);
                }

                if (global.userCache) global.userCache.delete(realJid);

                return m.reply(`✅ *${numero}* fue removido de la blacklist correctamente.`);
            }
        },
        3: {
            name: 'listblack',
            alias: ['blacklisted'],
            owner: true, // Mantiene la restricción solo para creadores/owners
            run: async function (m) {
                const lista = await global.User.find({ banned: true }).lean().catch(() => []);

                if (!lista || lista.length === 0) {
                    return m.reply('📋 La blacklist se encuentra vacía.');
                }

                const texto = lista
                    .map((item, i) => `${i + 1}. *${item.id.split('@')[0]}* — ${item.banReason || 'Sin motivo'}`)
                    .join('\n');

                return m.reply(`📋 *LISTA NEGRA DE USUARIOS (${lista.length})*\n\n${texto}`);
            }
        }
    }
};
