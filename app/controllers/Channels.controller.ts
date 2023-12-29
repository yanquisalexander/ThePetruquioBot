import { Request, Response } from 'express';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import User from '../models/User.model';
import Channel from '../models/Channel.model';
import Twitch from '../modules/Twitch.module';
import { ChannelPreferences, defaultChannelPreferences } from '../../utils/ChannelPreferences.class';
import Redemption from '../models/Redemption.model';
import Session from '../models/Session.model';
import TwitchAuthenticator from "../modules/TwitchAuthenticator.module";
import CurrentUser from "../../lib/CurrentUser";
import Audit, { AuditType } from "../models/Audit.model";

class ChannelsController {
    static async getPreferences(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        console.log(session);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        if (session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if (!impersonatedUser) {
                return res.status(404).json({ error: 'Impersonated user not found' })
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if (!impersonatedChannel) {
                return res.status(404).json({ error: 'Impersonated channel not found' })
            }

            console.log(impersonatedChannel);

            return res.json({
                data: {
                    preferences: impersonatedChannel.preferences,
                },
            })
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        // If channel preferences have a key that defaultChannelPreferences doesn't have, it will be ignored

        for (const preferenceKey of Object.keys(channel.preferences)) {
            // @ts-ignore
            if (defaultChannelPreferences[preferenceKey] === undefined) {
                // @ts-ignore
                delete channel.preferences[preferenceKey];
            }
        }




        return res.json({
            data: {
                preferences: channel.preferences,
            },
        })
    }

    static async updatePreferences(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        console.log(req.user)

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }


        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const originalPreferences = JSON.parse(JSON.stringify(channel.preferences));
        const preferences = req.body.preferences as ChannelPreferences

        if (!preferences) {
            return res.status(400).json({ error: 'Preferences are required' });
        }

        const preferencesKeys = Object.keys(preferences);

        for (const preferenceKey of preferencesKeys) {
            // @ts-ignore
            if (channel.preferences[preferenceKey] === undefined) {
                delete (preferences as any)[preferenceKey];
            } else {
                // @ts-ignore
                channel.preferences[preferenceKey].value = preferences[preferenceKey].value;
            }
        }

        if (preferencesKeys.includes('useStreamerAccount') && preferences.useStreamerAccount?.value) {
            if (!TwitchAuthenticator.RefreshingAuthProvider.hasUser(channel.twitchId)) {
                return res.status(400).json({ error: 'TWITCH_TOKEN_NOT_FOUND', message: 'Your Twitch account session has expired, please authorize again' });
            }
            let scopes = TwitchAuthenticator.RefreshingAuthProvider.getCurrentScopesForUser(channel.twitchId)
            if (!scopes.includes('chat:edit') || !scopes.includes('channel:bot') || !scopes.includes('user:bot')) {
                {
                    return res.status(400).json({ error: 'INSUFFICIENT_SCOPES', message: 'The user does not have the required scopes to use this feature' });
                }
            }
        }

        await channel.save();

        const changes = Object.keys(preferences).map((key) => {
            const oldValue = originalPreferences[key as keyof ChannelPreferences]?.value;
            const newValue = preferences[key as keyof ChannelPreferences]?.value;
            if (
                Array.isArray(oldValue) &&
                Array.isArray(newValue) &&
                oldValue.length === newValue.length &&
                oldValue.every((value, index) => value === newValue[index])
            ) {
                return null;
            }

            if (oldValue !== newValue) {
                return {
                    key,
                    oldValue,
                    newValue,
                };
            }
            return null;
        }).filter((change) => change !== null);

        console.log('Cambios realizados:', changes);


        let auditUser = user;
        if (currentUser.isImpersonating) {
            auditUser = await currentUser.getOriginalUser() || user;
        }


        const audit = new Audit({
            channel,
            user: auditUser,
            type: AuditType.SETTING_UPDATED,
            data: {
                changes,
            },
        });

        try {
            await audit.save();
        } catch (error) {
            console.log(error);
        }

        return res.json({
            data: {
                success: true,
            },
        });
    }



    static async getTwitchChannelsPoints(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if (session?.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if (!impersonatedUser) {
                return res.status(404).json({ error: 'Impersonated user not found' })
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if (!impersonatedChannel) {
                return res.status(404).json({ error: 'Impersonated channel not found' })
            }

            try {
                const channelsPoints = await Twitch.Helix.channelPoints.getCustomRewards(impersonatedChannel.twitchId);
                if (!channelsPoints) {
                    return res.status(404).json({ error: 'Channel does not have any custom rewards or channel is not affiliate/partner' });
                }

                const response = channelsPoints.map((channelPoint) => {
                    return {
                        id: channelPoint.id,
                        title: channelPoint.title,
                        prompt: channelPoint.prompt,
                        backgroundColor: channelPoint.backgroundColor,
                        icon: channelPoint.getImageUrl(2),
                    }
                })

                return res.json({
                    data: {
                        channelPoints: response,
                    },
                })
            } catch (error) {
                return res.status(404).json({ error: 'Channel does not have any custom rewards or channel is not affiliate/partner' });
            }


        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        try {
            const channelsPoints = await Twitch.Helix.channelPoints.getCustomRewards(channel.twitchId);

            if (!channelsPoints) {
                return res.status(404).json({ error: 'Channel does not have any custom rewards or channel is not affiliate/partner' });
            }

            const response = channelsPoints.map((channelPoint) => {
                return {
                    id: channelPoint.id,
                    title: channelPoint.title,
                    prompt: channelPoint.prompt,
                    backgroundColor: channelPoint.backgroundColor,
                    icon: channelPoint.getImageUrl(2),
                }
            })

            return res.json({
                data: {
                    channelPoints: response,
                },
            })
        } catch (error) {
            return res.status(404).json({ error: 'Channel does not have any custom rewards or channel is not affiliate/partner' });
        }
    }

    static async getFirstRanking(req: Request, res: Response) {

        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        if (!channel.preferences.firstRankingRewardId?.value || !channel.preferences.enableFirstRanking?.value) {
            return res.status(404).json({ error: 'Channel does not have first ranking enabled' });
        }

        const redemptions = await Redemption.firstRankingLeaderboard(channel, channel.preferences.firstRankingRewardId?.value);
        const historical = await Redemption.findByChannelAndReward(channel, channel.preferences.firstRankingRewardId?.value, true);

        return res.json({
            data: {
                redemptions,
                historical,
            },
        })
    }

    static async getAudits(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const audits = await channel.getAudits();

        return res.json({
            data: {
                audits,
            },
        })
    }
}


export default ChannelsController;
