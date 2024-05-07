import { type Request, type Response } from 'express'
import { type ExpressUser } from '../interfaces/ExpressUser.interface'
import CurrentUser from '../../lib/CurrentUser'
import Twitch from "../modules/Twitch.module"
import { CustomWidget } from "../models/CustomWidget.model"
import SocketIO from "../modules/SocketIO.module"

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

        return res.json({
            data: {
                widgets: widgets
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

            return res.json({
                data: {
                    widget: widget.data
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

        const widget = new CustomWidget({
            id: crypto.randomUUID().toString(),
            channel_id: channel.id as number,
            ...req.body
        })

        await widget.save()

        return res.json({
            data: {
                widget
            }
        })

    }

}