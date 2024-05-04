import { VM } from 'vm2';
import axios from 'axios';

import Database from '../../lib/DatabaseManager';
import Channel from './Channel.model';
import chalk from 'chalk';
import { Bot } from '../../bot';
import WorkflowLog from './WorkflowLog.model';

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
        const bot = await Bot.getInstance();

        let executionLog: string[] = [];
        let executionSuccess = true;
        const vm = new VM({
            timeout: 10000,
            sandbox: {
                data,
                channel: this.channel,
                axios,
                console: {
                    log: (...args: any[]) => {
                        const logMessage = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
                        executionLog.push(logMessage);
                        console.log(chalk.green('[WORKFLOW]'), ...args);
                    },
                    error: (...args: any[]) => {
                        executionSuccess = false;
                        const errorMessage = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
                        executionLog.push(chalk.red(errorMessage));
                        console.error(chalk.red(errorMessage));
                    }
                },

                sendMessage: (message: string) => {
                    if (typeof message !== 'string') {
                        console.error(chalk.red('[WORKFLOW]'), chalk.white('Message must be a string.'));
                        console.error(chalk.red('[WORKFLOW]'), chalk.white('Passed message:'), message);
                        return;
                    }
                    bot.sendMessage(this.channel, message);
                }
            },
        });

        try {
            console.log(`[Workflow] Executing workflow ${this.eventType} for channel ${this.channel.user.displayName}`);
            vm.run(this.script)


            console.log(`[Workflow] Workflow ${this.eventType} for channel ${this.channel.user.displayName} executed successfully.`);
        } catch (error) {
            executionSuccess = false;
            executionLog.push((error as Error).message);
            console.error(error);
            console.error(`[Workflow] Workflow ${this.eventType} for channel ${this.channel.user.displayName} failed to execute.`);
        } finally {
            console.log('[Workflow] Execution Log:', executionLog);
            console.log('[Workflow] Execution Status:', executionSuccess ? 'Success' : 'Failure');

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