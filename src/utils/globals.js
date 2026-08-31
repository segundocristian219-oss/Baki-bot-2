import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

let activeConn = null;

export function initGlobals(connInstance) {
    activeConn = connInstance;

    global.inapp = async ({ chat, title = '★ Shadow Garden ★', text = '▮on', buttonName = 'inapp_signup', buttonParams = {}, quoted } = {}) => {
        if (!activeConn) throw new Error('La conexión de WhatsApp no está inicializada.');

        const targetChat = chat;
        const paramsJson = typeof buttonParams === 'string' ? buttonParams : JSON.stringify(buttonParams);

        const rawPayload = {
            interactiveMessage: {
                header: {
                    title: title
                },
                body: {
                    text: text
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: buttonName,
                            buttonParamsJson: paramsJson
                        }
                    ],
                    messageParamsJson: ""
                }
            }
        };

        const options = {
            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [
                        {
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1"
                            },
                            content: [
                                {
                                    tag: "native_flow",
                                    attrs: {
                                        name: buttonName
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        if (quoted) options.quoted = quoted;

        return await activeConn.relayMessage(targetChat, rawPayload, options);
    };

    global.customButtons = async ({ chat, title = '', body = '', footer = '', buttons = [], quoted } = {}) => {
        if (!activeConn) throw new Error('La conexión de WhatsApp no está inicializada.');

        const rawPayload = {
            buttonsMessage: {
                contentText: body,
                footerText: footer,
                headerType: 1,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id || `btn_${index}`,
                    buttonText: { displayText: btn.text },
                    type: 1
                }))
            }
        };

        const options = {};
        if (quoted) options.quoted = quoted;

        return await activeConn.relayMessage(chat, rawPayload, options);
    };
}
