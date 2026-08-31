const fonts = {
    1: { name: "Negrita Serif", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝐀𝐁𝐂ＤＥＦＧＨＩ𝐉𝐊𝐋𝐌𝐍classＱregistered𝐒𝐓𝐔𝐕𝐖𝐗Ｙ𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤l𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳" },
    2: { name: "Cursiva Serif", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛" },
    3: { name: "Monocromático", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚀𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣" },
    4: { name: "Gótico", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔜𝔝𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷" },
    5: { name: "Script", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏" },
    6: { name: "Doble Línea", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "mathbb{A}\mathbb{B}\mathbb{C}\mathbb{D}\mathbb{E}\mathbb{F}\mathbb{G}\mathbb{H}\mathbb{I}\mathbb{J}\mathbb{K}\mathbb{L}\mathbb{M}\mathbb{N}\mathbb{O}\mathbb{P}\mathbb{Q}\mathbb{R}\mathbb{S}\mathbb{T}\mathbb{U}\mathbb{V}\mathbb{W}\mathbb{X}\mathbb{Y}\mathbb{Z}\mathbb{a}\mathbb{b}\mathbb{c}\mathbb{d}\mathbb{e}\mathbb{f}\mathbb{g}\mathbb{h}\mathbb{i}\mathbb{j}\mathbb{k}\mathbb{l}\mathbb{m}\mathbb{n}\mathbb{o}\mathbb{p}\mathbb{q}\mathbb{r}\mathbb{s}\mathbb{t}\mathbb{u}\mathbb{v}\mathbb{w}\mathbb{x}\mathbb{y}\mathbb{z}" },
    7: { name: "Burbujas", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ" },
    8: { name: "Cuadrados", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "🄰🄱🄲🄳🄴🄱🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉" },
    9: { name: "Sans Negrita", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝗔𝗕Ｃ𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰typed𝗲𝗳𝗴𝗵𝗶𝗷 civilisation𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳" },
    10: { name: "Máquina", map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", to: "𝙰𝙱Ｃ𝙳ＥＦ𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅禮𝚾𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝔥𝔦ջ𝚔𝚕𝚖𝔫𝔬𝔭𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣" }
};

export const fontCommand = {
    category: 'fun',
    commands: {
        fuente: {
            name: 'fuente',
            alias: ['font', 'estilo'],
            run: async (m, { text, usedPrefix, command }) => {
                if (!text) return m.reply(`> ✎ Uso: ${usedPrefix + command} <número 1-10> <texto>\n\nEjemplo: ${usedPrefix + command} 2 hola`);

                const args = text.split(' ');
                const index = parseInt(args[0]);
                const content = args.slice(1).join(' ');

                if (isNaN(index) || !fonts[index]) {
                    let list = `> ✰ *LISTA DE FUENTES*\n\n`;
                    for (let i in fonts) list += `${i}. ${fonts[i].name}\n`;
                    return m.reply(list);
                }

                if (!content) return m.reply(`> ✎ Escribe el texto después del número.`);

                const selectedFont = fonts[index];
                let result = content.split('').map(char => {
                    const pos = selectedFont.map.indexOf(char);
                    return pos !== -1 ? Array.from(selectedFont.to)[pos] : char;
                }).join('');

                await m.reply(result);
            }
        }
    }
};
