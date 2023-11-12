import { VM } from 'vm2';
import axios from 'axios';

import Database from '../../lib/DatabaseManager';
import Channel from './Channel.model';
import chalk from 'chalk';
import { Bot } from '../../bot';

export enum EventType {
    OnStreamStarted = 'ON_STREAM_STARTED',
    OnStreamEnded = 'ON_STREAM_ENDED',
    OnChannelFollowed = 'ON_CHANNEL_FOLLOWED',
    OnCustomRewardRedeemed = 'ON_CUSTOM_REWARD_REDEEMED',
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
        const result = await Database.query('SELECT * FROM workflows WHERE channel_id = $1 AND event_type = $2', [channel.twitchId, eventType]);
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

    async execute(data: any): Promise<void> {
        const bot = await Bot.getInstance();
        const vm = new VM({
            timeout: 10000,
            sandbox: {
                event: data,
                channel: this.channel,
                axios,
                console,
                sendMessage: (message: string) => {
                    bot.sendMessage(this.channel, message);
                }
            },
        });
    
        try {
            console.log(`[Workflow] Executing workflow ${this.eventType} for channel ${this.channel.user.displayName}`);
            console.log(`[Workflow] Script: ${this.script}`);
            
            vm.run(this.script);
    
            console.log(`[Workflow] Workflow ${this.eventType} for channel ${this.channel.user.displayName} executed successfully.`);
        } catch (error) {
            console.error(error);
            console.error(`[Workflow] Workflow ${this.eventType} for channel ${this.channel.user.displayName} failed to execute.`);
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