import { Request, Response } from 'express';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import Workflow, { EventType } from '../models/Workflow.model';
import CurrentUser from '../../lib/CurrentUser';
import WorkflowLog from "../models/WorkflowLog.model";
import jwt, { type JsonWebTokenError } from 'jsonwebtoken';
import Channel from "../models/Channel.model";
import User from "../models/User.model";

class WorkflowsController {
    static async getWorkflows(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!currentUser || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }


        const workflows = await Workflow.findAll(channel);

        return res.json({
            data: {
                workflows,
                event_types: Object.values(EventType),
                user_api_token: await user?.getApiToken()
            },
        });
    }

    static async createWorkflow(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);
        const { event_type, script } = req.body;

        if (Object.values(EventType).indexOf(event_type) === -1) {
            return res.status(400).json({ error: `${event_type} is not a valid event type` });
        }

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!currentUser || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }

        let workflow;

        try {
            workflow = await Workflow.create(channel, event_type, script);

        } catch (error) {
            return res.status(400).json({ error: `Already exists a workflow for ${event_type}` });
        }
        return res.json({
            data: {
                workflow,
            },
        });
    }

    static async updateWorkflow(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);
        const { event_type } = req.params;
        const { script } = req.body;

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!user || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }


        const workflow = await Workflow.find(channel, event_type as EventType);

        if (!workflow || workflow.channel.twitchId !== user.twitchId) {
            return res.status(404).json({ error: 'Workflow not found or unauthorized' });
        }

        await workflow.update(script);

        return res.json({
            data: {
                workflow,
            },
        });
    }

    static async deleteWorkflow(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);
        const { event_type } = req.params;

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!user || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }

        let workflow;
        try {
            workflow = await Workflow.find(channel, event_type as EventType);
        } catch (error) {
            return res.status(404).json({ error: 'Workflow not found' });
        }


        if (!workflow || workflow.channel.twitchId !== user.twitchId) {
            return res.status(404).json({ error: 'Workflow not found or unauthorized' });
        }

        await workflow.delete();

        return res.json({
            message: 'Workflow deleted successfully',
        });
    }

    static async getLogs(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!user || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }

        try {
            const logs = await WorkflowLog.findAll(channel)
            return res.json({
                data: {
                    logs,
                },
            });
        } catch (error) {
            return res.status(404).json({ error: 'Cannot find logs' });
        }
    }

    static async deleteLog(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);
        const { log_id } = req.params;

        const user = await currentUser.getCurrentUser();
        const channel = await user?.getChannel();

        if (!user || !channel) {
            return res.status(404).json({ error: 'User or channel not found' });
        }

        try {
            const log = await WorkflowLog.find(log_id);
            if (!log) {
                return res.status(404).json({ error: 'Log not found' });
            }
            await log.delete();
            return res.json({
                message: 'Log deleted successfully',
            });
        } catch (error) {
            return res.status(404).json({ error: 'Cannot find log' });
        }
    }

    static async processIncomingRequest(req: Request, res: Response) {
        if (req.method === 'GET') {
            return res.status(400).json({
                error_type: 'GET_NOT_ALLOWED',
                errors: [
                    'GET method is not allowed for incoming requests 😿'
                ]
            });
        }

        try {
            if (!req.params.user_api_token) {
                return res.status(400).json({
                    error_type: 'USER_API_TOKEN_NOT_FOUND',
                    errors: [
                        'User API token not found in request 😿'
                    ]
                });
            }

            const isTokenRevoked = await User.isTokenRevoked(req.params.user_api_token);

            if (isTokenRevoked) {
                return res.status(401).json({
                    error_type: 'UNAUTHORIZED',
                    errors: [
                        'This API token has been revoked'
                    ]
                });
            }

            let decodedPayload: string | jwt.JwtPayload | null = null;
            try {
                decodedPayload = jwt.verify(req.params.user_api_token, process.env.JWT_SECRET as string);
            } catch (JWTError) {
                return res.status(401).json({
                    error_type: 'UNAUTHORIZED',
                    errors: [
                        'Invalid API token'
                    ]
                });
            }

            const channel = await Channel.findByTwitchId((decodedPayload as any).userId);

            if (!channel) {
                return res.status(404).json({
                    error_type: 'CHANNEL_NOT_FOUND',
                    errors: [
                        'The user associated with this token does not have a channel'
                    ]
                });
            }

            const workflow = await Workflow.find(channel, EventType.OnWebhook);

            if (!workflow) {
                return res.status(404).json({
                    error_type: 'WORKFLOW_NOT_FOUND',
                    errors: [
                        "The user doesn't have a workflow for this event type (ON_WEBHOOK)"
                    ]
                });
            } else {
                await workflow.execute({
                    original_url: req.originalUrl,
                    payload: req.body,
                    headers: req.headers,
                    origin: req.hostname,
                    query: req.query,
                    url: req.url,
                });
                return res.status(200).json({
                    success: true,
                    message: 'Webhook executed successfully',
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error_type: 'INTERNAL_SERVER_ERROR',
                errors: [
                    'An error occurred while processing the incoming request 😿'
                ]
            });
        }
    }

}

export default WorkflowsController;
