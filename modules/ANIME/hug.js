import { runReaction } from './_runReaction.js'

export const hugCommand = {
    category: 'interacciones',
    commands: {
        hug: {
            name: 'hug',
            alias: ['hug', 'abrazo'],
            run: async (m, ctx) => runReaction('hug', m, ctx)
        }
    }
};
