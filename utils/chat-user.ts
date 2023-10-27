import { ChatUserstate } from 'tmi.js';
import GreetingsManager from '../app/modules/GreetingsManager.module';
import 'dotenv/config'

class ChatUser {
    constructor(private userstate: ChatUserstate, private message?: string) {}

    get id(): number {
        return parseInt(this.userstate['user-id'] || '0');
    }

    get messageId(): string {
        return this.userstate.id || '';
    }
    
    get rawMessage(): string {
        return this.message || '';
    }

    get color(): string {
        return this.userstate.color || '';
    }

    get isModerator(): boolean {
        return this.userstate['user-type'] === 'mod' || (this.userstate.badges && this.userstate.badges.moderator === '1') || this.isBroadcaster || this.isBotOwner || false;
    }

    get isBroadcaster(): boolean {
        return this.userstate.badges && this.userstate.badges.broadcaster === '1' || false;
    }

    get isSubscriber(): boolean {
        return !!this.userstate.subscriber;
    }

    get isVIP(): boolean {
        return !!this.userstate.badges && !!this.userstate.badges.vip;
    }

    get isBot(): boolean {
        return GreetingsManager.knownBots.includes(this.username);
    }

    get displayName(): string {
        return this.userstate['display-name'] || this.userstate.username || '';
    }

    get username(): string {
        return this.userstate.username || '';
    }

    get isBotOwner(): boolean {
        return this.userstate.username === process.env.BOT_OWNER;
    }

    get raw(): ChatUserstate {
        return this.userstate;
    }

}

export default ChatUser;
