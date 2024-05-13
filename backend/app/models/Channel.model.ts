import Database from '../../lib/DatabaseManager'
import defaultChannelPreferences, { type ChannelPreferences } from '../../utils/ChannelPreferences.class'
import { Configuration } from "../config"
import SocketIO from "../modules/SocketIO.module"
import Twitch from "../modules/Twitch.module"
import Audit, { type AuditDTO } from './Audit.model'
import { Command } from './Command.model'
import CommunityBook from './CommunityBook.model'
import { CoreWidget } from './CoreWidget.model'
import Shoutout from './Shoutout.model'
import User from './User.model'
import Workflow from './Workflow.model'
import WorldMap from './WorldMap.model'

class Channel {
  id: number | undefined
  twitchId: number
  autoJoin: boolean
  preferences: ChannelPreferences
  user: User

  constructor(twitchId: number, autoJoin: boolean, preferences: ChannelPreferences, user: User) {
    this.twitchId = twitchId
    this.autoJoin = autoJoin
    this.preferences = mergePreferences(defaultChannelPreferences, preferences)
    this.user = user
  }

  public static async getAutoJoinChannels(): Promise<Channel[]> {
    const channelsData = await Database.query('SELECT * FROM channels WHERE auto_join = true')
    const channels: Channel[] = []

    for (const channelData of channelsData.rows) {
      const user = await User.findByTwitchId(channelData.twitch_id)
      if (!user) {
        console.error(`User with Twitch ID ${channelData.twitch_id} not found`)
        continue
      }
      const channel = new Channel(
        channelData.twitch_id,
        channelData.auto_join,
        channelData.preferences,
        user
      )
      channel.id = channelData.id // Asigna el ID desde la base de datos
      channels.push(channel)
    }

    return channels
  }

  public static async findByTwitchId(twitchId: number): Promise<Channel | null> {
    const query = 'SELECT * FROM channels WHERE twitch_id = $1'
    const values = [twitchId]
    const result = await Database.query(query, values)

    if (result.rows.length > 0) {
      const channelData = result.rows[0]
      const user = await User.findByTwitchId(channelData.twitch_id)
      if (!user) {
        console.error(`User with Twitch ID ${channelData.twitch_id} not found`)
        return null
      }
      return new Channel(
        channelData.twitch_id,
        channelData.auto_join,
        mergePreferences(defaultChannelPreferences, channelData.preferences),
        user
      )
    } else {
      return null
    }
  }

  public static async findByUsername(username: string): Promise<Channel | null> {
    const user = await User.findByUsername(username)
    if (!user) {
      console.error(`User with username ${username} not found`)
      return null
    }

    const query = 'SELECT * FROM channels WHERE twitch_id = $1'
    const values = [user.twitchId]
    const result = await Database.query(query, values)

    if (result.rows.length > 0) {
      const channelData = result.rows[0]
      return new Channel(
        channelData.twitch_id,
        channelData.auto_join,
        mergePreferences(defaultChannelPreferences, channelData.preferences),
        user
      )
    } else {
      return null
    }
  }

  public async save(): Promise<void> {
    try {
      const query = 'INSERT INTO channels (twitch_id, auto_join, preferences) VALUES ($1, $2, $3) ON CONFLICT (twitch_id) DO UPDATE SET auto_join = $2, preferences = $3'
      const values = [this.twitchId, this.autoJoin, this.preferences]
      await Database.query(query, values)
    } catch (error) {
      console.error(error)
      throw new Error('Failed to save channel.')
    }
  }

  public async getWorldMap(): Promise<any[]> {
    return await WorldMap.getChannelWorldMap(this.twitchId)
  }

  public async getCommands(): Promise<Command[]> {
    return await Command.getChannelCommands(this)
  }

  public async getShoutouts(): Promise<any[]> {
    return await Shoutout.getChannelShoutouts(this)
  }

  public async getCommunityBooks(): Promise<any[]> {
    return await CommunityBook.getByChannel(this)
  }

  public async getWorkflows(): Promise<Workflow[]> {
    return await Workflow.findAll(this)
  }

  public async getAudits(): Promise<AuditDTO[] | null> {
    return await Audit.getAuditsByChannel(this)
  }

  public async getCoreWidgets(): Promise<CoreWidget[]> {
    return await CoreWidget.findByChannel(this)
  }

  public async changeStreamTitle(title: string): Promise<void> {
    const res = await Twitch.Helix.channels.updateChannelInfo(this.twitchId, { title })
    SocketIO.getInstance().emitEvent(`stream-manager:${this.twitchId}`, 'title-change', { title })
    return res
  }

  public async toggleEmoteOnly(enabled: boolean): Promise<void> {
    return await Twitch.Helix.asUser(Configuration.TWITCH_USER_ID, async ctx => {
      const res = await ctx.chat.updateSettings(this.twitchId, {
        emoteOnlyModeEnabled: enabled
      })

      if (res) return
    })
  }

  public async clearChat(): Promise<void> {
    return await Twitch.Helix.asUser(Configuration.TWITCH_USER_ID, async ctx => {
      await ctx.moderation.deleteChatMessages(this.twitchId)
    })
  }

  public static async findOrCreate(id: number): Promise<Channel> {
    const channel = await Channel.findByTwitchId(id)
    if (channel) {
      return channel
    } else {
      const user = await User.findByTwitchId(id)
      if (!user) {
        throw new Error(`User with Twitch ID ${id} not found`)
      }
      const channel = new Channel(id, true, defaultChannelPreferences, user)
      await channel.save()
      return channel
    }
  }

}

export default Channel

function mergePreferences(defaultPrefs: any, channelPrefs: any): any {
  const mergedPrefs: any = { ...channelPrefs } // Inicia con las preferencias del canal

  // Itera sobre todas las claves de defaultPrefs
  for (const key in defaultPrefs) {
    if (Object.prototype.hasOwnProperty.call(defaultPrefs, key)) {
      // Verifica si la clave existe en channelPrefs
      if (channelPrefs[key] !== undefined) {
        // Si la clave es un objeto y contiene field_type
        if (typeof defaultPrefs[key] === 'object' && typeof channelPrefs[key] === 'object' && 'field_type' in defaultPrefs[key]) {
          // Realiza la fusión recursiva del campo field_type sin reemplazar el valor de value
          mergedPrefs[key] = {
            ...channelPrefs[key],
            field_type: mergeFieldType(defaultPrefs[key].field_type, channelPrefs[key].field_type),
            patreon_required: channelPrefs[key].patreonRequired || defaultPrefs[key].patreonRequired
          }
        } else if (typeof defaultPrefs[key] === 'object' && typeof channelPrefs[key] === 'object') {
          // En caso de objetos anidados, realiza la fusión recursiva
          mergedPrefs[key] = mergePreferences(defaultPrefs[key], channelPrefs[key])
        } else {
          // En otros casos, asigna el valor de channelPrefs[key]
          mergedPrefs[key] = channelPrefs[key]
        }
      } else {
        // Si la clave no existe en channelPrefs, asigna el valor de defaultPrefs[key]
        mergedPrefs[key] = defaultPrefs[key]
      }
    }
  }

  const orderedPrefs: any = {}

  for (const key in defaultPrefs) {
    if (Object.prototype.hasOwnProperty.call(defaultPrefs, key)) {
      orderedPrefs[key] = mergedPrefs[key]
    }
  }

  return orderedPrefs
}

function mergeFieldType(defaultFieldType: any, channelFieldType: any): any {
  // Si channelFieldType es undefined o es del mismo tipo que defaultFieldType, devuelve defaultFieldType
  if (channelFieldType === undefined || typeof channelFieldType === typeof defaultFieldType) {
    return defaultFieldType
  }

  // En caso contrario, devuelve defaultFieldType
  return defaultFieldType
}
