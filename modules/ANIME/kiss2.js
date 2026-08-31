import { runReaction } from './_runReaction.js'

export const kiss2Command = {
    category: 'interacciones',
    commands: {
        kiss2: {
            name: 'kiss2',
            alias: ['beso2', 'kiss2'],
            run: async (m, ctx) => runReaction('kiss2', m, ctx)
        }
    }
};
