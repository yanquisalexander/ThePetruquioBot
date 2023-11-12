import { Request, Response } from 'express';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import Workflow, { EventType } from '../models/Workflow.model';
import CurrentUser from '../../lib/CurrentUser';

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
            },
        });
    }

    static async createWorkflow(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);
        const { event_type, script } = req.body;

        if(Object.values(EventType).indexOf(event_type) === -1) {
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
}

export default WorkflowsController;
