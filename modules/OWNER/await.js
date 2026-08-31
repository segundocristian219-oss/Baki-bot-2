import { format, inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);

function expandObject(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => expandObject(item, seen));
    }

    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
        return Array.from(obj);
    }

    const plain = {};
    const props = Object.getOwnPropertyNames(obj);
    for (const prop of props) {
        try {
            plain[prop] = expandObject(obj[prop], seen);
        } catch {
            plain[prop] = '[Unresolvable]';
        }
    }
    return plain;
}

export const evalModule = {
    category: 'owner',
    commands: {
        eval: {
            name: 'eval',
            alias: ['>', '=>', 'await'],
            libre: true,
            run: async (m, { conn, isROwner, args, settings, text }) => {
                if (!isROwner) return;

                const rawText = m.text.trim();
                let cleanText = '';

                if (rawText.startsWith('.=>')) {
                    cleanText = rawText.slice(3).trim();
                } else if (rawText.startsWith('=>')) {
                    cleanText = rawText.slice(2).trim();
                } else if (rawText.startsWith('.>')) {
                    cleanText = rawText.slice(2).trim();
                } else if (rawText.startsWith('>')) {
                    cleanText = rawText.slice(1).trim();
                } else if (rawText.startsWith('await ')) {
                    cleanText = rawText.slice(6).trim();
                } else {
                    cleanText = text ? text.trim() : '';
                }

                if (!cleanText) return;

                if ((rawText.startsWith('=>') || rawText.startsWith('.=>')) && !cleanText.startsWith('return ')) {
                    cleanText = 'return ' + cleanText;
                }

                let groupMetadata = null;
                if (m.isGroup) {
                    try {
                        groupMetadata = await conn.groupMetadata(m.chat);
                    } catch {
                        groupMetadata = null;
                    }
                }

                let output;
                try {
                    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    const executor = new AsyncFunction(
                        'conn', 'm', 'text', 'args', 'groupMetadata', 'settings', 'require', 'process', 'format',
                        cleanText
                    );

                    output = await executor.call(
                        conn, 
                        conn, m, cleanText, args, groupMetadata, settings, require, process, format
                    );
                } catch (err) {
                    output = err;
                } finally {
                    if (output !== undefined) {
                        let formattedOutput;
                        if (typeof output === 'string') {
                            formattedOutput = output;
                        } else {
                            const expanded = expandObject(output);
                            formattedOutput = inspect(expanded, {
                                depth: null,
                                showHidden: true,
                                getters: true,
                                maxArrayLength: null,
                                maxStringLength: null,
                                customInspect: false
                            });
                        }
                        await conn.sendMessage(m.chat, { text: formattedOutput }, { quoted: m }).catch(() => null);
                    }
                }
            }
        }
    }
};
