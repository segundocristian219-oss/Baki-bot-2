import { runReaction } from './_runReaction.js'

export const helloCommand = {
    category: 'interacciones',
    commands: {
        hello: {
            name: 'hello',
            alias: ['hola', 'hello', 'hi'],
            run: async (m, ctx) => runReaction('hello', m, ctx)
        }
    }
};
