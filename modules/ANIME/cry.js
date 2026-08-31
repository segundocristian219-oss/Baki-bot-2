import { runReaction } from './_runReaction.js'

export const cryCommand = {
    category: 'interacciones',
    commands: {
        cry: {
            name: 'cry',
            alias: ['llorar'],
            run: async (m, ctx) => runReaction('cry', m, ctx)
        }
    }
};
