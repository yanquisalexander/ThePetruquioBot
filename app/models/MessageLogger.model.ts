import chalk from 'chalk'
import Database from '../../lib/DatabaseManager'
import Environment from '../../utils/environment'
import type Channel from './Channel.model'
import type User from './User.model'
import Utils from '../../lib/Utils'

interface MessageData {
  sender: User
  channel: Channel
  content: string
  timestamp: Date
}

class MessageLogger {
  static async getByUser (user: User): Promise<any[]> {
    try {
      const query = `
                SELECT u.avatar, u.display_name, u.username, m.content, m.timestamp
                FROM messages m
                JOIN users u ON m.channel_id = u.twitch_id
                WHERE m.sender_id = $1 ORDER BY m.timestamp DESC
            `
      const values = [user.twitchId]

      const result = await Database.query(query, values)
      return result.rows
    } catch (error) {
      return []
    }
  }

  public static async logMessage (messageData: MessageData): Promise<void> {
    const { sender, channel, content, timestamp } = messageData

    if (Environment.isDevelopment) {
      console.log(chalk.green('[MESSAGE LOGGER]'), chalk.white(`Registrando mensaje de ${sender.username} en ${channel.user.username}: ${content}`))
    }

    try {
      const query = 'INSERT INTO messages (sender_id, channel_id, content, timestamp) VALUES ($1, $2, $3, $4)'
      const values = [sender.twitchId, channel.twitchId, content, timestamp]
      await Database.query(query, values, !Environment.isDevelopment)
    } catch (error) {
      console.error('Error al registrar mensaje:', error)
    }
  }

  public static async getCount (): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) FROM messages'
      const result = await Database.query(query)
      return result.rows[0].count
    } catch (error) {
      console.error('Error al obtener cantidad de mensajes:', error)
      return 0
    }
  }

  public static async getLast30Days (timezone?: string): Promise<any[]> {
    if (!timezone || Utils.emptyString(timezone)) {
      timezone = 'UTC'
    }
    try {
      const query = `
            SELECT
                    DATE_TRUNC('day', timestamp AT TIME ZONE $1) AS day,
                    CAST(COUNT(*) AS INT) AS message_count
                FROM
                    messages
                WHERE
                    timestamp >= NOW() - INTERVAL '30 days'
                GROUP BY
                    day
                ORDER BY
                    day;
            `

      const result = await Database.query(query, [timezone])
      return result.rows
    } catch (error) {
      console.error('Error al obtener cantidad de mensajes en los últimos 30 días:', error)
      return []
    }
  }

  public static async getTop10 (): Promise<any[]> {
    try {
      const query = `
                SELECT
                    u.username,
                    CAST(COUNT(*) AS INT) AS message_count
                FROM
                    messages m
                JOIN
                    users u ON m.sender_id = u.twitch_id
                GROUP BY
                    u.username
                ORDER BY
                    message_count DESC
                LIMIT 10;
            `

      const result = await Database.query(query)
      return result.rows
    } catch (error) {
      console.error('Error al obtener top 10 de usuarios con más mensajes:', error)
      return []
    }
  }

  public static async getTop10Channels (): Promise<any[]> {
    try {
      const query = `
                SELECT
                    c.username,
                    CAST(COUNT(*) AS INT) AS message_count
                FROM
                    messages m
                JOIN
                    channels c ON m.channel_id = c.twitch_id
                GROUP BY
                    c.username
                ORDER BY
                    message_count DESC
                LIMIT 10;
            `

      const result = await Database.query(query)
      return result.rows
    } catch (error) {
      console.error('Error al obtener top 10 de canales con más mensajes:', error)
      return []
    }
  }

  public static async getLast30DaysByChannel (channel: Channel, timezone?: string): Promise<any[]> {
    if (!timezone || Utils.emptyString(timezone)) {
      timezone = 'UTC'
    }
    try {
      const query = `
            SELECT
                    DATE_TRUNC('day', timestamp AT TIME ZONE $2) AS day,
                    CAST(COUNT(*) AS INT) AS message_count
                FROM
                    messages
                WHERE
                    timestamp >= CURRENT_TIMESTAMP AT TIME ZONE $2 - INTERVAL '30 days' AND channel_id = $1
                GROUP BY
                    day
                ORDER BY
                    day;
            `

      const result = await Database.query(query, [channel.twitchId, timezone])
      return result.rows
    } catch (error) {
      console.error('Error al obtener cantidad de mensajes en los últimos 30 días:', error)
      return []
    }
  }

  public static async getTop10ByChannel (channel: Channel): Promise<any[]> {
    try {
      const query = `
                SELECT
                    u.username,
                    u.avatar,
                    CAST(COUNT(*) AS INT) AS message_count
                FROM
                    messages m
                JOIN
                    users u ON m.sender_id = u.twitch_id
                WHERE
                    m.channel_id = $1
                GROUP BY
                    u.username,
                    u.avatar
                ORDER BY
                    message_count DESC
                LIMIT 10;
            `

      const result = await Database.query(query, [channel.twitchId])
      return result.rows
    } catch (error) {
      console.error('Error al obtener top 10 de usuarios con más mensajes:', error)
      return []
    }
  }
}

export default MessageLogger
