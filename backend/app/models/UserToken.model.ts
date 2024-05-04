import { type AccessToken } from '@twurple/auth'
import Database from '../../lib/DatabaseManager'
import User from './User.model' // Asegúrate de importar el modelo User
import { dbService } from '../services/Database'
import { UserTokensTable } from '@/db/schema'

class UserToken {
  userId: number
  tokenData: AccessToken

  constructor (userId: number, tokenData: AccessToken) {
    this.userId = userId
    this.tokenData = tokenData
  }

  static async getAll (): Promise<UserToken[]> {
    const result = await dbService.select().from(UserTokensTable)

    const userTokens: UserToken[] = []

    for (const userTokenData of result) {
      const user = await User.findByTwitchId(userTokenData.user_id)
      if (!user) {
        console.error(`User with Twitch ID ${userTokenData.user_id} not found`)
        continue
      }
      userTokens.push(new UserToken(userTokenData.user_id, userTokenData.token_data as AccessToken))
    }

    return userTokens
  }

  static async findByUserId (userId: number): Promise<UserToken | null> {
    const query = 'SELECT token_data FROM user_tokens WHERE user_id = $1'
    const values = [userId]

    try {
      const result = await Database.query(query, values)
      if (result.rows.length > 0) {
        const tokenData = result.rows[0].token_data
        return new UserToken(userId, tokenData)
      }
      return null
    } catch (error) {
      console.log(error)
      throw new Error('Failed to find user token by user ID')
    }
  }

  async save (): Promise<void> {
    const query = 'INSERT INTO user_tokens (user_id, token_data) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token_data = $2'
    const values = [this.userId, this.tokenData]

    try {
      await Database.query(query, values)
    } catch (error) {
      console.log(error)
      throw new Error('Failed to save user token')
    }
  }

  async update (): Promise<void> {
    const query = 'UPDATE user_tokens SET token_data = $2 WHERE user_id = $1'
    const values = [this.userId, this.tokenData]

    try {
      await Database.query(query, values)
    } catch (error) {
      console.log(error)
      throw new Error('Failed to update user token by user ID')
    }
  }

  async delete (): Promise<void> {
    const query = 'DELETE FROM user_tokens WHERE user_id = $1'
    const values = [this.userId]

    try {
      await Database.query(query, values)
    } catch (error) {
      console.log(error)
      throw new Error('Failed to delete user token by user ID')
    }
  }
}

export default UserToken
