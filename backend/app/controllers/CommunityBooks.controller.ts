import { Request, Response } from "express";
import Channel from "../models/Channel.model";
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import CommunityBook from "../models/CommunityBook.model";
import CommunityBookContribution from "../models/CommunityBookContributions.model";
import Session from "../models/Session.model";
import User from "../models/User.model";



class CommunityBooksController {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    static async getCommunityBooks(req: Request, res: Response): Promise<Response> {
        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const communityBooks = await channel.getCommunityBooks();

        return res.json({
            data: {
                community_books: communityBooks
            }
        });
    }

    static async getCommunityBook(req: Request, res: Response): Promise<Response> {
        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const communityBook = await CommunityBook.findById(req.params.communityBookId);

        if (!communityBook) {
            return res.status(404).json({ error: 'Community Book not found' });
        }

        return res.json({
            data: {
                community_book: communityBook
            }
        });
    }

    static async createCommunityBook(req: Request, res: Response): Promise<Response> {

        const currentUser = req.user as ExpressUser;
        const session = await Session.findBySessionId(currentUser.session.sessionId);

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

            const communityBook = await CommunityBook.create(impersonatedChannel, req.body.title, req.body.description, null, '');

            return res.json({
                data: {
                    community_book: communityBook
                }
            });
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const communityBook = await CommunityBook.create(channel, req.body.title, req.body.description, null, '');

        return res.json({
            data: {
                community_book: communityBook
            }
        });





    }

}

export default CommunityBooksController;