import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import { EventType } from "./Workflow.model";


/*  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE workflow_logs (
    id SERIAL PRIMARY KEY,
    execution_id UUID DEFAULT uuid_generate_v4(),
    event_type VARCHAR(255) NOT NULL,
    script TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    channel_id INTEGER REFERENCES channels(twitch_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); */


class WorkflowLog {
    id: number;
    executionId: string;
    eventType: EventType;
    script: string;
    success: boolean;
    channel: Channel;
    createdAt: Date;
    updatedAt: Date;

    constructor(id: number, executionId: string, eventType: EventType, script: string, success: boolean, channel: Channel, createdAt: Date, updatedAt: Date) {
        this.id = id;
        this.executionId = executionId;
        this.eventType = eventType;
        this.script = script;
        this.success = success;
        this.channel = channel;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async find(executionId: string): Promise<WorkflowLog | undefined> {
        const result = await Database.query('SELECT * FROM workflow_logs WHERE execution_id = $1', [executionId]);
        if (result.rows.length > 0) {
            return new WorkflowLog(result.rows[0].id, result.rows[0].execution_id, result.rows[0].event_type, result.rows[0].script, result.rows[0].success, result.rows[0].channel_id, result.rows[0].created_at, result.rows[0].updated_at);
        }
        return;
    }

    static async findAll(channel: Channel): Promise<WorkflowLog[]> {
        const result = await Database.query('SELECT * FROM workflow_logs WHERE channel_id = $1', [channel.twitchId]);
        const workflowLogs: WorkflowLog[] = [];
        for (const workflowLogData of result.rows) {
            workflowLogs.push(new WorkflowLog(workflowLogData.id, workflowLogData.execution_id, workflowLogData.event_type, workflowLogData.script, workflowLogData.success, channel, workflowLogData.created_at, workflowLogData.updated_at));
        }
        return workflowLogs;
    }

    static async create(eventType: string, script: string, success: boolean, channel: Channel): Promise<WorkflowLog> {
        const result = await Database.query('INSERT INTO workflow_logs (event_type, script, success, channel_id) VALUES ($1, $2, $3, $4) RETURNING *', [eventType, script, success, channel.twitchId]);
        return new WorkflowLog(result.rows[0].id, result.rows[0].execution_id, result.rows[0].event_type, result.rows[0].script, result.rows[0].success, channel, result.rows[0].created_at, result.rows[0].updated_at);
    }

    async delete(): Promise<void> {
        await Database.query('DELETE FROM workflow_logs WHERE id = $1', [this.id]);
    }
}

export default WorkflowLog;