import { ExpressUser } from '../app/interfaces/ExpressUser.interface';
import Session from '../app/models/Session.model';
import User from '../app/models/User.model';
import Channel from '../app/models/Channel.model';
import { defaultChannelPreferences } from '../utils/ChannelPreferences.class';

class CurrentUser {
    private expressUser: ExpressUser;

    constructor(expressUser: ExpressUser) {
        this.expressUser = expressUser;
    }

    async getCurrentUser(): Promise<User | null> {
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

        return { ...defaultChannelPreferences, ...channel.preferences };
    }
}

export default CurrentUser;
