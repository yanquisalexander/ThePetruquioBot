import { ExpressUser } from '../app/interfaces/ExpressUser.interface';
import Session from '../app/models/Session.model';
import User from '../app/models/User.model';
import Channel from '../app/models/Channel.model';

class CurrentUser {
    private expressUser: ExpressUser;

    constructor(expressUser: ExpressUser) {
        this.expressUser = expressUser;
    }

    async getCurrentUser(): Promise<User | null> {
        if (this.expressUser.systemToken) {
            /* 
                If is a System Token (a.k.a API Token) don't verify session
            */
            return User.findByTwitchId(parseInt(this.expressUser.twitchId)) || null;
        }

        const session = await Session.findBySessionId(this.expressUser.session.sessionId);

        if (!session) {
            return null;
        }

        if (session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            return impersonatedUser || null;
        }

        return User.findByTwitchId(parseInt(this.expressUser.twitchId)) || null;
    }

    async getCurrentChannel(): Promise<Channel | null> {
        const user = await this.getCurrentUser();

        if (!user) {
            return null;
        }

        return user.getChannel() || null;
    }

    async getCurrentPreferences(): Promise<{ [key: string]: any } | null> {
        const channel = await this.getCurrentChannel();

        if (!channel) {
            return null;
        }

        return channel.preferences
    }

    get isImpersonating(): boolean {
        return !!this.expressUser.session.impersonatedUserId;
    }

    async getOriginalUser(): Promise<User | null> {
        const session = await Session.findBySessionId(this.expressUser.session.sessionId);

        if (!session) {
            return null;
        }

        return User.findByTwitchId(this.expressUser.session.userId) || null;
    }
}

export default CurrentUser;
