export const autoAcceptCommand = {
    category: 'gruop',
    commands: {
        auto_accept_listener: {
            name: 'auto_accept_listener',
            alias: [],
            async init() {
                global.conn.ev.on('group-request.participants', async (update) => {
                    if (update.action !== 'request') return;
                    
                    const groupId = update.id;

                    try {
                        
                        const chat = await global.Chat.findOne({ id: groupId });
                        
                        
                        if (!chat || !chat.autoaceptar) return;

                        const participantJid = update.participants[0];
                        const phone = participantJid.split('@')[0];
                        
                        const restrictedPrefixes = ['966', '971', '965', '968', '974', '973', '962', '961', '963', '967', '212', '20'];
                        const isRestricted = restrictedPrefixes.some(prefix => phone.startsWith(prefix));

                        if (isRestricted) {
                            await global.conn.groupRequestParticipantsUpdate(groupId, [participantJid], 'reject').catch(() => null);
                        } else {
                            await global.conn.groupRequestParticipantsUpdate(groupId, [participantJid], 'approve').catch(() => null);
                        }
                    } catch (e) {
                        console.error("Error en auto_accept_listener:", e);
                    }
                });
            }
        }
    }
};

export default autoAcceptCommand;
