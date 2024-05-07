import { type Request, type Response } from 'express'
import { type ExpressUser } from '../interfaces/ExpressUser.interface'
import CurrentUser from '../../lib/CurrentUser'
import Twitch from "../modules/Twitch.module"
import { CustomWidget } from "../models/CustomWidget.model"
import SocketIO from "../modules/SocketIO.module"
import { Configuration } from "../config"
import TwitchAuthenticator from "../modules/TwitchAuthenticator.module"

export class CustomWidgetsController {

    async getWidgets(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        const widgets = await CustomWidget.getByChannel(channel)

        const userApiKey = await user.getApiToken()

        return res.json({
            data: {
                widgets,
                user_api_key: userApiKey
            }
        })

    }

    async updateWidget(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        const widgetId = req.params.id
        const widget = await CustomWidget.getById(widgetId)

        if (!widget) {
            return res.status(404).json({ error: 'Widget not found' })
        }

        widget.data = {
            ...widget.data,
            ...req.body,
            id: widget.data.id,
            created_at: widget.data.created_at || new Date(),
            updated_at: new Date(),
        }

        await widget.save()

        SocketIO.getInstance().emitEvent(`events:channel.${channel.twitchId}`, 'widgets:updated', null)


        return res.json({
            data: {
                widget
            }
        })

    }

    async getWidget(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        const widgetId = req.params.id
        try {
            const widget = await CustomWidget.getById(widgetId)

            if (!widget) {
                return res.status(404).json({ error: 'Widget not found' })
            }


            const twitchToken = TwitchAuthenticator.RefreshingAuthProvider.hasUser(user.twitchId) ? await TwitchAuthenticator.RefreshingAuthProvider.getAccessTokenForUser(user.twitchId) : null

            return res.json({
                data: {
                    widget: widget.data,
                    env_info: {
                        twitch_client_id: Configuration.TWITCH_CLIENT_ID,
                        twitch_token: twitchToken?.accessToken,
                        user
                    }
                }
            })

        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    async createWidget(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        if (req.query.templateId) {
            const templateId = req.query.templateId.toString()
            const template = await CustomWidget.getById(templateId)

            if (!template) {
                return res.status(404).json({ error: 'Template not found' })
            }

            const widget = new CustomWidget({
                ...template.data,
                ...req.body,
                id: crypto.randomUUID().toString(),
                widget_name: `${template.data.widget_name} - Copy`,
                channel_id: channel.twitchId as number,
                published_as_template: false,
                created_at: new Date(),
                updated_at: new Date(),
            })

            await widget.save()

            return res.json({
                data: {
                    widget
                }
            })
        }

        const widget = new CustomWidget({
            id: crypto.randomUUID().toString(),
            channel_id: channel.twitchId as number,
            widget_name: req.body.widget_name,
            ...req.body,
        })

        await widget.save()

        return res.json({
            data: {
                widget
            }
        })

    }

    async findTemplates(req: Request, res: Response): Promise<Response> {
        try {
            const widgets = await CustomWidget.searchTemplates(req.query.q?.toString() || '')

            return res.json({
                data: {
                    widgets
                }
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'An error occurred while searching for templates' })
        }
    }
}