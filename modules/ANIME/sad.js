import { runReaction } from './_runReaction.js'

export const sadCommand = {
    category: 'interacciones',
    commands: {
        sad: {
            name: 'sad',
            alias: ['sad', 'triste'],
            run: async (m, ctx) => runReaction('sad', m, ctx)
        }
    }
};
