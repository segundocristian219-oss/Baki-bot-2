import { runReaction } from './_runReaction.js'

export const coffeeCommand = {
    category: 'interacciones',
    commands: {
        coffee: {
            name: 'coffee',
            alias: ['coffee', 'cafe'],
            run: async (m, ctx) => runReaction('coffee', m, ctx)
        }
    }
};
