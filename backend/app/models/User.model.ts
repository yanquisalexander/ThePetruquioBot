import { type HelixUser } from '@twurple/api'
import Database from '../../lib/DatabaseManager'
import defaultChannelPreferences from '../../utils/ChannelPreferences.class'
import Channel from './Channel.model'
import Greeting from './Greeting.model'
import MessageLogger from './MessageLogger.model'
import Twitch from '../modules/Twitch.module'
import ExternalAccount, { type ExternalAccountProvider } from './ExternalAccount.model'
import Notification from './Notification.model'
import jwt from 'jsonwebtoken'
import Utils from '../../lib/Utils'
import Patreon from '../modules/Patreon.module'
import TwitchAuthenticator from '../modules/TwitchAuthenticator.module'
import { paypalService } from '../services/PayPal'

class User {
  username: string
  twitchId: number
  email?: string
  displayName?: string
  avatar?: string
  admin?: boolean
  birthday?: Date | null
  customIdPaypal: string

  constructor (username: string, twitchId: number, email?: string, displayName?: string, avatar?: string, admin?: boolean, birthday?: Date) {
    this.username = username
    this.twitchId = twitchId
    this.email = email
    this.displayName = displayName
    this.avatar = avatar
    this.admin = admin ?? false
    this.birthday = birthday
    this.customIdPaypal = `P-${twitchId}`
  }

  public static async findByUsername (username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username ILIKE $1'
    const values = [username]
    const result = await Database.query(query, values)

    if (result.rows.length > 0) {
      const userData = result.rows[0]
      return new User(
        userData.username,
        userData.twitch_id,
        userData.email,
        userData.display_name || userData.username,
        userData.avatar || null,
        userData.admin,
        userData.birthday_date || null
      )
    } else {
      return null
    }
  }

  public static async findByTwitchId (twitchId: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE twitch_id = $1'
    const values = [twitchId]
    const result = await Database.query(query, values)

    if (result.rows.length > 0) {
      const userData = result.rows[0]
      return new User(
        userData.username,
        userData.twitch_id,
        userData.email,
        userData.display_name || userData.username,
        userData.avatar || null,
        userData.admin,
        userData.birthday_date || null
      )
    } else {
      return null
    }
  }

  public static async findAll (): Promise<User[]> {
    const query = 'SELECT * FROM users'
    const result = await Database.query(query)

    const users: User[] = []
    for (const userData of result.rows) {
      users.push(new User(
        userData.username,
        userData.twitch_id,
        userData.email,
        userData.display_name || userData.username,
        userData.avatar || null,
        userData.admin,
        userData.birthday_date || null
      ))
    }

    return users
  }

  public async getChannel (): Promise<Channel | null> {
    return await Channel.findByTwitchId(this.twitchId)
  }

  async getMessages (): Promise<any[]> {
    return await MessageLogger.getByUser(this)
  }

  async isPatron (): Promise<boolean> {
    return await Patreon.isUserSubscribed(this)
  }

  async isSuscribed (): Promise<boolean> {
    return await paypalService.isSubscriptionActive(this.customIdPaypal)
  }

  public async getGreetingsData (): Promise<any> {
    return await Greeting.getByUser(this)
  }

  async createChannelWithPreferences (): Promise<Channel> {
    const channel = await Channel.findByTwitchId(this.twitchId)
    if (!channel) {
      const newChannel = new Channel(this.twitchId, false, defaultChannelPreferences, this)
      await newChannel.save()
      return newChannel
    }
    return channel
  }

  public async save (): Promise<void> {
    const query = 'INSERT INTO users (username, twitch_id, email, display_name, avatar, birthday_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (twitch_id) DO UPDATE SET username = $1, email = $3, display_name = $4, avatar = $5, birthday_date = $6 RETURNING twitch_id'
    const values = [this.username, this.twitchId, this.email, this.displayName, this.avatar, this.birthday]
    try {
      const result = await Database.query(query, values)
      this.twitchId = result.rows[0].twitch_id
    } catch (error) {
      console.error(error)
      throw new Error('Error saving user: ' + (error as Error).message)
    }
  }

  isBirthdayToday (): boolean {
    if (!this.birthday) {
      return false
    }
    const today = new Date()
    return this.birthday.getDate() === today.getDate() && this.birthday.getMonth() === today.getMonth()
  }

  hasHelixToken (): boolean {
    return TwitchAuthenticator.RefreshingAuthProvider.hasUser(this.twitchId)
  }

  async fromHelix (): Promise<HelixUser | null> {
    try {
      const user = await Twitch.getUser(this.username)
      return user
    } catch (error) {
      console.error(error)
      return null
    }
  }

  static async count (): Promise<number> {
    try {
      const result = await Database.query('SELECT COUNT(*) FROM users')
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error(error)
      return 0
    }
  }

  async getLinkedAccounts (): Promise<ExternalAccount[]> {
    return await ExternalAccount.findByUser(this)
  }

  async getLinkedAccount (provider: ExternalAccountProvider): Promise<ExternalAccount | null> {
    return await ExternalAccount.findByProviderAndUser(provider, this)
  }

  async getUnreadNotificationsCount (): Promise<number> {
    return await Notification.getUnreadCount(this)
  }

  async getNotifications (): Promise<Notification[]> {
    return await Notification.findByUser(this)
  }

  async generateApiToken (): Promise<string> {
    try {
      // Genera un nuevo token
      const customToken = jwt.sign({
        userId: this.twitchId,
        systemToken: true
      }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '9999 years' }) /* System Token should never expire unless revoked */

      // Consulta el token existente
      const tokenExists = await Database.query('SELECT api_token FROM users WHERE twitch_id = $1', [this.twitchId])

      // Revoca el token existente si hay uno
      if (tokenExists.rows[0]?.api_token) {
        await Database.query('INSERT INTO revoked_api_tokens (api_token) VALUES ($1)', [tokenExists.rows[0].api_token])
      } else {
        console.error('No se ha encontrado el token API del usuario', this.twitchId)
        // Puedes manejar esta situación según tus necesidades
      }

      // Actualiza la base de datos con el nuevo token
      await Database.query('UPDATE users SET api_token = $1 WHERE twitch_id = $2', [customToken, this.twitchId])

      return customToken
    } catch (error) {
      console.error('Error al generar el token API:', error)
      throw error
    }
  }

  static async isTokenRevoked (token: string): Promise<boolean> {
    // Check if token is revoked
    const revoked = await Database.query('SELECT * FROM revoked_api_tokens WHERE api_token = $1', [token])
    if (revoked.rows.length > 0) {
      return true
    } else {
      return false
    }
  }

  async getApiToken (): Promise<string | null> {
    try {
      const tokenQueryResult = await Database.query('SELECT api_token FROM users WHERE twitch_id = $1', [this.twitchId])

      if (tokenQueryResult.rows.length > 0) {
        const apiToken = tokenQueryResult.rows[0].api_token

        if (apiToken && !await User.isTokenRevoked(apiToken) && !Utils.emptyString(apiToken)) {
          return apiToken
        }
      }

      return await this.generateApiToken()
    } catch (error) {
      console.error('Error al obtener el token API:', error)
      return null
    }
  }

  async getModeratedChannels (): Promise<any[] | unknown> {
    if (!this.hasHelixToken()) {
      return []
    }

    const helixUser = await this.fromHelix()
    if (!helixUser) {
      return []
    }

    const moderatedChannels = await Twitch.Helix.asUser(helixUser, async ctx => {
      const res = await ctx.moderation.getModeratedChannels(helixUser.id)
      return res
    })

    return moderatedChannels.data
  }
}

export default User
