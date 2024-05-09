import ivm from 'isolated-vm';
import Database from '../../lib/DatabaseManager';
import Channel from './Channel.model';
import chalk from 'chalk';
import { Bot } from '../../bot';
import WorkflowLog from './WorkflowLog.model';
import SocketIO from "../modules/SocketIO.module";

export enum EventType {
    OnStreamStarted = 'ON_STREAM_STARTED',
    OnStreamEnded = 'ON_STREAM_ENDED',
    OnChannelFollowed = 'ON_CHANNEL_FOLLOWED',
    OnCustomRewardRedeemed = 'ON_CUSTOM_REWARD_REDEEMED',
    OnChatMessage = 'ON_CHAT_MESSAGE',
    OnWebhook = 'ON_WEBHOOK',
}

class Workflow {
    id: number;
    channel: Channel;
    eventType: EventType;
    script: string;

    constructor(id: number, channel: Channel, eventType: EventType, script: string) {
        this.id = id;
        this.channel = channel;
        this.eventType = eventType;
        this.script = script;
    }

    static async find(channel: Channel, eventType: EventType): Promise<Workflow | undefined> {
        const result = await Database.query('SELECT * FROM workflows WHERE channel_id = $1 AND event_type = $2', [channel.twitchId, eventType], eventType === EventType.OnChatMessage);
        if (result.rows.length > 0) {
            return new Workflow(result.rows[0].id, channel, result.rows[0].event_type, result.rows[0].script);
        }
        return;
    }

    static async findAll(channel: Channel): Promise<Workflow[]> {
        const result = await Database.query('SELECT * FROM workflows WHERE channel_id = $1', [channel.twitchId]);
        const workflows: Workflow[] = [];
        for (const workflowData of result.rows) {
            workflows.push(new Workflow(workflowData.id, channel, workflowData.event_type, workflowData.script));
        }
        return workflows;
    }

    static async create(channel: Channel, eventType: EventType, script: string): Promise<Workflow> {
        const result = await Database.query('INSERT INTO workflows (channel_id, event_type, script) VALUES ($1, $2, $3) RETURNING *', [channel.twitchId, eventType, script]);
        return new Workflow(result.rows[0].id, channel, eventType, script);
    }

    async update(script: string): Promise<void> {
        await Database.query('UPDATE workflows SET script = $1 WHERE id = $2', [script, this.id]);
    }

    async delete(): Promise<void> {
        await Database.query('DELETE FROM workflows WHERE id = $1', [this.id]);
    }

    async execute(data: any, skipLog?: boolean): Promise<void> {
        const isolate = new ivm.Isolate({ memoryLimit: 128 });
        const context = isolate.createContextSync();
        const jail = context.global;
        const channel = this.channel;
        const bot = await Bot.getInstance();
        const socket = SocketIO.getInstance();

        const setSync = (key: string, value: any) => {
            jail.setSync(key, value, {
                copy: true,
                release: true,
            });
        }

        let executionLog: string[] = [];
        let executionSuccess = true;

        jail.setSync('global', jail.derefInto());

        setSync('data', data);
        setSync('channel', channel);


        jail.setSync('emitToWidget', (data: any) => socket.emitEvent(`events:channel.${channel.twitchId}`, 'workflow-data', data));
        jail.setSync('log', (message: string) => {
            console.log(chalk.green('[WORKFLOW]'), message);
            let logMessage = message;
            try {
                logMessage = JSON.stringify(message, null, 2);
            } catch (error) {
                logMessage = message;
            }

            executionLog.push(logMessage);
        });
        jail.setSync('sendMessage', (message: string) => {
            if (typeof message !== 'string') {
                console.error(chalk.red('[WORKFLOW]'), chalk.white('Message must be a string.'));
                console.error(chalk.red('[WORKFLOW]'), chalk.white('Passed message:'), message);
                return;
            }
            bot.sendMessage(channel, message);
        });

        const script = await isolate.compileScript(this.script);

        try {
            await script.run(context);
        } catch (error) {
            console.error(error);
            executionSuccess = false;
            executionLog.push((error as Error).message);
        } finally {
            executionLog.push('')
            //isolate.wallTime
            executionLog.push(`Execution Status: ${executionSuccess ? 'Success' : 'Failure'}`);
            executionLog.push(`Execution time: ${Number(isolate.wallTime) / 1000000}ms`);
            isolate.dispose();
            try {
                await WorkflowLog.create(this.eventType, this.script, executionSuccess, this.channel, executionLog.join('\n'));
            } catch (error) {
                console.error(error);
                console.error(`[Workflow] Failed to create workflow log for workflow ${this.eventType} for channel ${this.channel.user.displayName}.`);
            }
        }


    }


    async getScript(): Promise<string> {
        return this.script;
    }

    async setScript(script: string): Promise<void> {
        this.script = script;
        await this.update(script);
    }
}



export default Workflow;