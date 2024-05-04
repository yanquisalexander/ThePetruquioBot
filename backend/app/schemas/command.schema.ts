import z from 'zod'

const CommandSchema = z.object({
    name: z.string({
        invalid_type_error: 'Command name must be a string',
        required_error: 'Command name is required',
    }).min(1).max(32),
    response: z.string({
        invalid_type_error: 'Command response must be a string',
        required_error: 'Command response is required',
    }).min(1).max(500), // Twitch chat message limit is 500 characters
    enabled: z.boolean().optional(),
    permissions: z.array(z.enum(['everyone', 'subscriber', 'vip', 'moderator', 'broadcaster'])),
    aliases: z.array(z.string().min(1).max(32)).optional(),
})

export default CommandSchema