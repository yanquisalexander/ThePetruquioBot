import { type ChatUserstate } from 'tmi.js'
import GreetingsManager from '../app/modules/GreetingsManager.module'
import 'dotenv/config'

class ChatUser {
  constructor (private readonly userstate: ChatUserstate, private readonly message?: string) { }

  get id (): number {
    return parseInt(this.userstate['user-id'] ?? '0')
  }

  get messageId (): string {
    return this.userstate.id ?? ''
  }

  get rawMessage (): string {
    return this.message ?? ''
  }

  get color (): string {
    return this.userstate.color ?? ''
  }

  get isBroadcaster (): boolean {
    return (this.userstate.badges && this.userstate.badges.broadcaster === '1') ?? false
  }

  get isModerator (): boolean {
    return this.userstate['user-type'] === 'mod' ?? (this.userstate.badges && this.userstate.badges.moderator === '1') ?? this.isBroadcaster ?? this.isBotOwner ?? false
  }

  get isMod (): boolean {
    /*
            Same as isModerator, but broadcaster is not considered a mod (Used only on CommandPermissions)
        */
    return this.userstate['user-type'] === 'mod' ?? (this.userstate.badges && this.userstate.badges.moderator === '1') ?? this.isBotOwner ?? false
  }

  get isSubscriber (): boolean {
    return !!this.userstate.subscriber
  }

  get isVIP (): boolean {
    return !!this.userstate.badges && !!this.userstate.badges.vip
  }

  get isBot (): boolean {
    return GreetingsManager.knownBots.includes(this.username)
  }

  get isViewer (): boolean {
    /*
            Todo usuario que no tenga ninguna distinción en el canal, será considerado un viewer.
        */
    return !this.isModerator && !this.isBroadcaster && !this.isBot && !this.isVIP && !this.isSubscriber && !this.isBotOwner
  }

  get displayName (): string {
    return (this.userstate['display-name'] ?? this.userstate.username) ?? ''
  }

  get username (): string {
    return this.userstate.username ?? ''
  }

  get isBotOwner (): boolean {
    return this.userstate.username === process.env.BOT_OWNER
  }

  get raw (): ChatUserstate {
    return this.userstate
  }
}

export default ChatUser
