import { type Request, type Response } from 'express'
import { type ExpressUser } from '../interfaces/ExpressUser.interface'
import User from '../models/User.model'
import Twitch from '../modules/Twitch.module'
import Shoutout from '../models/Shoutout.model'
import Session from '../models/Session.model'
import CurrentUser from '@/lib/CurrentUser'

class CommunitiesController {
  static async getShoutouts (req: Request, res: Response): Promise<Response> {
    const user = new CurrentUser(req.user as ExpressUser)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getCurrentChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const shoutouts = await channel.getShoutouts()

    return res.json({ data: { shoutouts } })
  }

  static async createShoutout (req: Request, res: Response) {
    const currentUser = req.user as ExpressUser
    const { messages, enabled, target_streamer } = req.body

    const session = await Session.findBySessionId(currentUser.session.sessionId)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.impersonatedUserId) {
      const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId)

      if (!impersonatedUser) {
        return res.status(404).json({ error: 'Impersonated user not found' })
      }

      const channel = await impersonatedUser.getChannel()

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' })
      }

      const twitchTargetStreamer = await Twitch.getUser(target_streamer)

      if (!twitchTargetStreamer) {
        return res.status(404).json({ error: 'Target streamer not found' })
      }

      let targetUser = await User.findByTwitchId(parseInt(twitchTargetStreamer.id))

      if (!targetUser) {
        targetUser = new User(twitchTargetStreamer.name, parseInt(twitchTargetStreamer.id), undefined, twitchTargetStreamer.displayName, twitchTargetStreamer.profilePictureUrl)
        await targetUser.save()
      }

      let shoutout = await Shoutout.find(channel, targetUser)

      if (!shoutout) {
        shoutout = new Shoutout(channel, targetUser, messages, enabled)
        await shoutout.save()
      } else {
        return res.status(400).json({ error: `Shoutout already exists for ${targetUser.username}` })
      }

      return res.json({ data: { shoutout } })
    }

    const user = await User.findByTwitchId(parseInt(currentUser.twitchId))

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const twitchTargetStreamer = await Twitch.getUser(target_streamer)

    if (!twitchTargetStreamer) {
      return res.status(404).json({ error: 'Target streamer not found' })
    }

    let targetUser = await User.findByTwitchId(parseInt(twitchTargetStreamer.id))

    if (!targetUser) {
      targetUser = new User(twitchTargetStreamer.name, parseInt(twitchTargetStreamer.id), undefined, twitchTargetStreamer.displayName, twitchTargetStreamer.profilePictureUrl)
      await targetUser.save()
    }

    let shoutout = await Shoutout.find(channel, targetUser)

    if (!shoutout) {
      shoutout = new Shoutout(channel, targetUser, messages, enabled)
      await shoutout.save()
    } else {
      return res.status(400).json({ error: `Shoutout already exists for ${targetUser.username}` })
    }

    return res.json({ data: { shoutout } })
  }

  static async updateShoutout (req: Request, res: Response) {
    try {
      const user = new CurrentUser(req.user as ExpressUser)

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { messages, enabled } = req.body
      const { targetStreamerId } = req.params

      const channel = await user.getCurrentChannel()

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' })
      }

      if (!targetStreamerId) {
        return res.status(400).json({ error: 'Target streamer ID is required' })
      }

      const targetStreamer = await User.findByTwitchId(parseInt(targetStreamerId))

      if (!targetStreamer) {
        return res.status(404).json({ error: 'Target streamer not found' })
      }

      const shoutout = await Shoutout.find(channel, targetStreamer)

      if (!shoutout) {
        return res.status(404).json({ error: 'Shoutout not found' })
      }

      shoutout.messages = messages
      shoutout.enabled = enabled

      await shoutout.save()

      return res.json({ data: { shoutout } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  static async deleteShoutout (req: Request, res: Response) {
    const currentUser = req.user as ExpressUser

    const session = await Session.findBySessionId(currentUser.session.sessionId)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.impersonatedUserId) {
      const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId)

      if (!impersonatedUser) {
        return res.status(404).json({ error: 'Impersonated user not found' })
      }

      const channel = await impersonatedUser.getChannel()

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' })
      }

      const { targetStreamerId } = req.params

      if (!targetStreamerId) {
        return res.status(400).json({ error: 'Target streamer ID is required' })
      }

      const targetStreamer = await User.findByTwitchId(parseInt(targetStreamerId))

      if (!targetStreamer) {
        return res.status(404).json({ error: 'Target streamer not found' })
      }

      const shoutout = await Shoutout.find(channel, targetStreamer)

      if (!shoutout) {
        return res.status(404).json({ error: 'Shoutout not found' })
      }

      await shoutout.delete()

      return res.json({ data: { success: true } })
    }

    const user = await User.findByTwitchId(parseInt(currentUser.twitchId))

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const { targetStreamerId } = req.params

    if (!targetStreamerId) {
      return res.status(400).json({ error: 'Target streamer ID is required' })
    }

    const targetStreamer = await User.findByTwitchId(parseInt(targetStreamerId))

    if (!targetStreamer) {
      return res.status(404).json({ error: 'Target streamer not found' })
    }

    const shoutout = await Shoutout.find(channel, targetStreamer)

    if (!shoutout) {
      return res.status(404).json({ error: 'Shoutout not found' })
    }

    await shoutout.delete()

    return res.json({ data: { success: true } })
  }
}

export default CommunitiesController
