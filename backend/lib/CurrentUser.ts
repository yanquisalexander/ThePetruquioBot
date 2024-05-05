import { type ExpressUser } from '../app/interfaces/ExpressUser.interface'
import Session from '../app/models/Session.model'
import User from '../app/models/User.model'
import type Channel from '../app/models/Channel.model'

class CurrentUser {
  private readonly expressUser: ExpressUser

  constructor (expressUser: ExpressUser) {
    this.expressUser = expressUser
  }

  async getCurrentUser (): Promise<User | null> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { system_token, twitchId, session: { sessionId } } = this.expressUser

    if (system_token) {
      return await User.findByTwitchId(parseInt(twitchId)) ?? null
    }

    const session = await Session.findBySessionId(sessionId)

    if (!session) {
      return null
    }

    if (session.impersonatedUserId) {
      return await User.findByTwitchId(session.impersonatedUserId) ?? null
    }

    return await User.findByTwitchId(parseInt(twitchId)) ?? null
  }

  async getCurrentChannel (): Promise<Channel | null> {
    const user = await this.getCurrentUser()

    if (!user) {
      return null
    }

    return await user.getChannel() ?? null
  }

  async getCurrentPreferences (): Promise<Record<string, any> | null> {
    const channel = await this.getCurrentChannel()

    return channel ? channel.preferences : null
  }

  get isImpersonating (): boolean {
    return !!this.expressUser.session.impersonatedUserId
  }

  async getOriginalUser (): Promise<User | null> {
    const { sessionId, userId } = this.expressUser.session
    const session = await Session.findBySessionId(sessionId)

    return session ? await User.findByTwitchId(userId) : null
  }

  async getSession (): Promise<Session | null> {
    const { sessionId } = this.expressUser.session

    return await Session.findBySessionId(sessionId)
  }
}

export default CurrentUser
