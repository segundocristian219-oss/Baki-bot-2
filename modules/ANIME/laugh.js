import { runReaction } from './_runReaction.js'

export const laughCommand = {
    category: 'interacciones',
    commands: {
        laugh: {
            name: 'laugh',
            alias: ['reir', 'laugh', 'jaja'],
            run: async (m, ctx) => runReaction('laugh', m, ctx)
        }
    }
};
