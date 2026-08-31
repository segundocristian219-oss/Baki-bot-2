import { runReaction } from './_runReaction.js'

export const kissCommand = {
    category: 'interacciones',
    commands: {
        kiss: {
            name: 'kiss',
            alias: ['beso', 'kiss'],
            run: async (m, ctx) => runReaction('kiss', m, ctx)
        }
    }
};
