import { runReaction } from './_runReaction.js'

export const nightsCommand = {
    category: 'interacciones',
    commands: {
        nights: {
            name: 'nights',
            alias: ['noches', 'good_night', 'goodnight'],
            run: async (m, ctx) => runReaction('nights', m, ctx)
        }
    }
};
