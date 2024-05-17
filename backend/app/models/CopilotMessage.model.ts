import { StreamCopilotMessagesTable } from '@/db/schema'
import { dbService } from '../services/Database'
import Channel from './Channel.model'
import { and, desc, eq, ilike, like, or } from 'drizzle-orm'

interface CopilotMessageData {
    id?: number
    channel_id: number
    message: string
    timestamp: Date
    thought: string | null
    role: "copilot" | "streamer"
}

class CopilotMessage {
    data: CopilotMessageData

    constructor(data: CopilotMessageData) {
        this.data = data
    }

    static async create(data: CopilotMessageData): Promise<CopilotMessage> {
        await dbService.insert(StreamCopilotMessagesTable)
            .values(data)

        return new CopilotMessage(data)
    }

    static async getByChannel(channel: Channel): Promise<CopilotMessage[]> {
        const data = await dbService.select({
            id: StreamCopilotMessagesTable.id,
            message: StreamCopilotMessagesTable.message,
            timestamp: StreamCopilotMessagesTable.timestamp,
            thought: StreamCopilotMessagesTable.thought,
            role: StreamCopilotMessagesTable.role,
        })
            .from(StreamCopilotMessagesTable)
            .where(eq(StreamCopilotMessagesTable.channel_id, channel.twitchId))

        if (!data) {
            return []
        }

        return data.map((d: any) => new CopilotMessage(d))
    }

    static async getById(id: number): Promise<CopilotMessage | null> {
        const data = await dbService.query.StreamCopilotMessagesTable
            .findFirst({
                where: eq(StreamCopilotMessagesTable.id, id)
            })

        if (!data) {
            return null
        }

        return new CopilotMessage(data)
    }

    static async getHistory(channel: Channel, limit: number = 20): Promise<CopilotMessage[]> {
        const data = await dbService.select().from(StreamCopilotMessagesTable)
            .where(eq(StreamCopilotMessagesTable.channel_id, channel.twitchId))
            .orderBy(desc(StreamCopilotMessagesTable.timestamp))
            .limit(limit)

        return data.map((d: any) => new CopilotMessage(d))
    }

    static async search(query: string): Promise<CopilotMessage[]> {
        const messages = await dbService.query.StreamCopilotMessagesTable.findMany({
            where: or(
                ilike(StreamCopilotMessagesTable.message, `%${query}%`),
                ilike(StreamCopilotMessagesTable.thought, `%${query}%`)
            )
        })

        return messages.map((m: any) => new CopilotMessage(m))
    }

    async delete(): Promise<void> {
        if (!this.data.id) throw new Error('Cannot delete a message without an id')
        await dbService.delete(StreamCopilotMessagesTable)
            .where(eq(StreamCopilotMessagesTable.id, this.data.id))
    }

    async update(data: Partial<CopilotMessageData>): Promise<void> {
        if (!this.data.id) throw new Error('Cannot update a message without an id')
        await dbService.update(StreamCopilotMessagesTable)
            .set(data)
            .where(eq(StreamCopilotMessagesTable.id, this.data.id))
    }

    async save(): Promise<CopilotMessage> {
        await dbService.insert(StreamCopilotMessagesTable)
            .values(this.data)
            .onConflictDoUpdate({
                target: [StreamCopilotMessagesTable.id],
                set: this.data
            })

        return new CopilotMessage(this.data)
    }

    async getChannel(): Promise<Channel | null> {
        return Channel.findByTwitchId(this.data.channel_id)
    }

    async getThought(): Promise<string | null> {
        return this.data.thought
    }

    async getMessage(): Promise<string> {
        return this.data.message
    }
}



export default CopilotMessage