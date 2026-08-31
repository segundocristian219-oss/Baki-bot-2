import { runReaction } from './_runReaction.js'

export const slapCommand = {
    category: 'interacciones',
    commands: {
        slap: {
            name: 'slap',
            alias: ['slap', 'bofetada'],
            run: async (m, ctx) => runReaction('slap', m, ctx)
        }
    }
};
