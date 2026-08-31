import { runReaction } from './_runReaction.js'

export const daysCommand = {
    category: 'interacciones',
    commands: {
        days: {
            name: 'days',
            alias: ['good_morning', 'goodmorning'],
            run: async (m, ctx) => runReaction('days', m, ctx)
        }
    }
};
