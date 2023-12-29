import { Request, Response } from "express";

import CurrentUser from "../../lib/CurrentUser";
import Widget from "../models/Widget.model";
import Channel from "../models/Channel.model";
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import SocketIO from "../modules/SocketIO.module";

class WidgetsController {
    static async getWidgets(req: Request, res: Response): Promise<Response> {
        const user = new CurrentUser(req.user as ExpressUser);

        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'Unauthorized'
                }
            });
        }

        const channel = await user.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({
                error: {
                    message: 'Channel not found'
                }
            });
        }

        const widgets = await Widget.findByChannel(channel);

        return res.status(200).json({
            data: widgets
        });
    }

    static async createWidget(req: Request, res: Response): Promise<Response> {
        const user = new CurrentUser(req.user as ExpressUser);

        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'Unauthorized'
                }
            });
        }

        const channel = await user.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({
                error: {
                    message: 'Channel not found'
                }
            });
        }

        const { name } = req.body;

        const widget = new Widget({
            name: name,
            isPrivate: true,
            json: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            channel: channel
        });

        await widget.save();

        return res.status(201).json({
            data: widget
        });
    }

    static async getWidget(req: Request, res: Response): Promise<Response> {
        const user = new CurrentUser(req.user as ExpressUser);

        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'Unauthorized'
                }
            });
        }

        const channel = await user.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({
                error: {
                    message: 'Channel not found'
                }
            });
        }

        try {
            const widget = await Widget.find(req.params.widgetId, channel);



            return res.status(200).json({
                data: widget
            });
        } catch (error) {
            return res.status(404).json({
                error: {
                    message: (error as Error).message
                }
            });
        }
    }

    static async updateWidget(req: Request, res: Response): Promise<Response> {
        const user = new CurrentUser(req.user as ExpressUser);

        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'Unauthorized'
                }
            });
        }

        const channel = await user.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({
                error: {
                    message: 'Channel not found'
                }
            });
        }

        try {
            const widget = await Widget.find(req.params.widgetId, channel);

            const { name, isPrivate, json } = req.body;

            widget.name = name || widget.name;
            widget.isPrivate = isPrivate || widget.isPrivate;
            widget.json = json || widget.json;
            widget.updatedAt = new Date();

            await widget.update();
            SocketIO.getInstance().emitEvent(`events:channel.${channel.twitchId}`, 'event', {
                type: 'widget.update',
            });
            return res.status(200).json({
                data: widget
            });
        } catch (error) {
            return res.status(404).json({
                error: {
                    message: (error as Error).message
                }
            });
        }
    }

    static async getWidgetConfig(req: Request, res: Response): Promise<Response> {
        const { widgetId } = req.params;

        if (!widgetId) {
            return res.status(400).json({
                error: {
                    message: 'Widget ID not found'
                }
            });
        }

        try {
            const widget = await Widget.findPublic(widgetId);

            return res.status(200).json({
                data: widget
            });
        } catch (error) {
            return res.status(404).json({
                error: {
                    message: (error as Error).message
                }
            });
        }
    }
}

export default WidgetsController;