import { type Request, type Response } from 'express'
import Twitch from '../modules/Twitch.module'
import TwitchAuthenticator from '../modules/TwitchAuthenticator.module'
import z, { ZodError } from 'zod'

export class TwitchToolsController {
  async searchUsers (req: Request, res: Response): Promise<Response> {
    try {
      // Validate query parameter with zod, minimum 3 characters
      const { query } = req.query as { query: string }

      z.string().min(3, 'Query must be at least 3 characters long').parse(query)

      const usersResponse = await Twitch.Helix.search.searchChannels(query)

      const users = await Promise.all(usersResponse.data.map(async (user) => {
        const u = await user.getUser()
        return {
          id: parseInt(u.id),
          username: u.name,
          displayName: u.displayName,
          avatar: u.profilePictureUrl
        }
      }))

      return res.json({ users })
    } catch (error) {
      console.error(error)
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors[0].message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
