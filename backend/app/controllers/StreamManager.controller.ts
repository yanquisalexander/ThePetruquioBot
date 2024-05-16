import { type Request, type Response } from 'express'
import { type ExpressUser } from '../interfaces/ExpressUser.interface'
import { Bot } from '../../bot'
import CurrentUser from '../../lib/CurrentUser'
import MessageLogger from '../models/MessageLogger.model'
import Notification from '../models/Notification.model'
import Twitch from "../modules/Twitch.module"
import StreamerSonglist from "../modules/StreamerSonglist.module"
import { streamCopilot } from "../modules/StreamCopilot.module"
import { context } from "esbuild"
import SocketIO from "../modules/SocketIO.module"

export class StreamManagerController {
    async index(req: Request, res: Response): Promise<Response> {
        return res.json({
            data: {
                message: 'Stream Manager'
            }
        })
    }

    async getStream(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        let songlistInfo = null

        if (channel.preferences.showSongRequestsOnMap?.value) {
            songlistInfo = await StreamerSonglist.getChannel(user.username)
        }

        const helixUser = await user.fromHelix()
        const channelFollowers = await helixUser?.getChannelFollowers().catch(() => null)
        const stream = await helixUser?.getStream()

        return res.json({
            data: {
                stream: stream,
                followers: channelFollowers?.total ?? 0,
                songlist: songlistInfo
            }
        })

    }

    async createClip(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }


        try {
            const clipUrl = await Twitch.Helix.clips.createClip({
                channel: channel.twitchId
            })


            return res.json({
                data: {
                    clip: clipUrl
                }
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Failed to create clip. ¿Maybe the user is not streaming?' })
        }

    }

    async talkToSmartAssistant(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        if (channel.preferences.enableSmartAssistant?.value === false) {
            return res.status(403).json({ error: 'Smart Assistant is disabled' })
        }

        const message = req.body.message

        if (!message) {
            return res.status(400).json({ error: 'Message is required' })
        }

        try {
            const response = await streamCopilot.generateText({
                prompt: message,
                user,
                channel
            })

            SocketIO.getInstance().emitEvent(`copilot:${channel.twitchId}`, 'copilot-response', {
                response
            })

            return res.json({
                data: {
                    context: response.context,
                    response: response.response.text(),
                    candidates: response.response.candidates
                }
            })

        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Copilot failed to generate text. Please try again later' })
        }



    }
}