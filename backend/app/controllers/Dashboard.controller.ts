import { type Request, type Response } from 'express'
import { type ExpressUser } from '../interfaces/ExpressUser.interface'
import { Bot } from '../../bot'
import CurrentUser from '../../lib/CurrentUser'
import MessageLogger from '../models/MessageLogger.model'
import Notification from '../models/Notification.model'
import Redemption from "../models/Redemption.model"
import Audit, { AuditType } from "../models/Audit.model"
import User from "../models/User.model"
import Channel from "../models/Channel.model"

export class DashboardController {
  async index(req: Request, res: Response): Promise<Response> {
    // Here we return bot status (Joined, muted, etc) and recommendations

    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const bot = await Bot.getInstance()
    const timezone = req.query.tz as string || 'UTC'
    const last30DaysMessageCount = await MessageLogger.getLast30DaysByChannel(channel, timezone)
    const redemptionLast30Days = await Redemption.getLast30DaysByChannel(channel, timezone)
    const stats = {
      top_chatters: await MessageLogger.getTop10ByChannel(channel),
      last_30_days_messages: last30DaysMessageCount,
      last_30_days_redemptions: redemptionLast30Days,
      average_messages_per_day: last30DaysMessageCount.map((day) => day.message_count).reduce((a, b) => a + b, 0) / last30DaysMessageCount.length,
      average_redemptions_per_day: redemptionLast30Days.map((day) => day.redemption_count).reduce((a, b) => a + b, 0) / redemptionLast30Days.length
    }

    const isBotJoined = bot.joinedChannels.includes(channel.user.username)
    const isBotMuted = channel.preferences.botMuted?.value

    const isPatron = await user.isPatron()
    return res.json({
      data: {
        bot: {
          joined: isBotJoined,
          muted: isBotMuted
        },
        stats,
        timezone,
        is_patron: isPatron
      }
    })
  }

  async getNotifications(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const notifications = await user.getNotifications()

    return res.status(200).json({ data: notifications })
  }

  async markNotificationAsRead(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const notificationId = req.params.id
      const notification = await Notification.findById(parseInt(notificationId))

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }

      if (notification.user.twitchId !== user.twitchId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      await notification.markAsRead()

      return res.status(200).json({ data: { success: true } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async sendMessageAsBot(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' })
    }

    const bot = await Bot.getInstance()

    if (!bot.joinedChannels.includes(channel.user.username)) {
      return res.status(400).json({ error: 'BOT_NOT_JOINED' })
    }

    if (channel.preferences.botMuted?.value) {
      return res.status(400).json({ error: 'BOT_MUTED' })
    }

    try {
      await bot.sendMessage(channel, req.body.message)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.json({ data: { success: true } })
  }

  async toggleMute(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    channel.preferences.botMuted.value = !channel.preferences.botMuted.value
    await channel.save()

    const bot = await Bot.getInstance()

    if (!bot.joinedChannels.includes(channel.user.username)) {
      return res.status(400).json({ error: 'Bot not joined' })
    }

    if (!channel.preferences.botMuted?.value) {
      await bot.sendMessage(channel, 'Hey! I\'m back! DinoDance (petruquiobot unmuted)')
    }

    return res.json({ data: { success: true } })
  }

  async join(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    channel.autoJoin = true
    await channel.save()

    const bot = await Bot.getInstance()

    if (bot.joinedChannels.includes(channel.user.username)) {
      return res.status(400).json({ error: 'Bot already joined' })
    }

    try {
      await bot.joinChannel(channel.user.username)
      await bot.sendMessage(channel, 'Hey! Ready to rock and roll! DinoDance (petruquiobot joined the channel)')
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.json({ data: { success: true } })
  }

  async part(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channel = await user.getChannel()

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    channel.autoJoin = false
    await channel.save()

    const bot = await Bot.getInstance()

    if (!bot.joinedChannels.includes(channel.user.username)) {
      return res.status(400).json({ error: 'Bot already parted' })
    }

    try {
      await bot.getBotClient().part(channel.user.username)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.json({ data: { success: true } })
  }

  async getModeratedChannels(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getOriginalUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const channels = await user.getModeratedChannels()

    // Add self to the list
    channels.push({
      id: user.twitchId.toString(),
      displayName: user.displayName ?? user.username,
      avatar: user.avatar ?? ''

    })

    return res.json({ data: channels })
  }

  async impersonateUser(req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()
    const session = await currentUser.getSession()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserChannel = await user.getChannel()


    const userId = req.params.userId

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const moderatedChannels = await user.getModeratedChannels()

    // Check if userId is present in the moderated channels


    if (
      !moderatedChannels.find((channel) => channel.id === userId) &&
      userId !== user.twitchId.toString()
    ) {
      return res.status(403).json({ error: 'You are not a moderator of this channel' });
    }

    const channelToImpersonate = await Channel.findByTwitchId(parseInt(userId))

    const auditForStreamer = new Audit({
      channel: channelToImpersonate as Channel,
      user,
      type: AuditType.IMPERSONATED_BY_MODERATOR,
      data: {
        moderator_name: user.displayName ?? user.username,
      }
    });

    const auditForModerator = new Audit({
      channel: currentUserChannel as Channel,
      user: channelToImpersonate?.user as User,
      type: AuditType.IMPERSONED_MODERATED_CHANNEL,
      data: {
        channel_name: channelToImpersonate?.user.displayName,
      }
    });

    try {
      await session.setImpersonate(parseInt(userId))

      try {
        await auditForStreamer.save()
        await auditForModerator.save()
      } catch (error) {
        console.error(error)
      }
      return res.json({ data: { success: true } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
