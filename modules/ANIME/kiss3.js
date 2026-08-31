import { runReaction } from './_runReaction.js'

export const kiss3Command = {
    category: 'interacciones',
    commands: {
        kiss3: {
            name: 'kiss3',
            alias: ['beso3', 'kiss3'],
            run: async (m, ctx) => runReaction('kiss3', m, ctx)
        }
    }
};
