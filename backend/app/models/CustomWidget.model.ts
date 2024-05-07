import { CustomWidgetsTable } from '@/db/schema'
import { dbService } from '../services/Database'
import Channel from './Channel.model'
import { eq, like } from 'drizzle-orm'

interface CustomWidgetData {
    id: string
    channel_id: number
    widget_name: string
    custom_html?: string | null
    custom_css?: string | null
    custom_js?: string | null
    properties?: any
    published_as_template?: boolean | null
    created_at?: Date | null
    updated_at?: Date | null
}

export class CustomWidget {
    data: CustomWidgetData

    constructor(data: CustomWidgetData) {
        this.data = data
    }

    static async getByChannel(channel: Channel): Promise<any> {
        const data = await dbService.select({
            id: CustomWidgetsTable.id,
            name: CustomWidgetsTable.widget_name,
            created_at: CustomWidgetsTable.created_at,
            updated_at: CustomWidgetsTable.updated_at,
        })
            .from(CustomWidgetsTable)
            .where(eq(CustomWidgetsTable.channel_id, channel.twitchId))

        if (!data) {
            return null
        }

        return data
    }

    static async getById(id: string): Promise<CustomWidget | null> {
        const data = await dbService.query.CustomWidgetsTable
            .findFirst({
                where: eq(CustomWidgetsTable.id, id)
            })

        if (!data) {
            return null
        }

        return new CustomWidget(data)
    }

    static async searchTemplates(query: string): Promise<any[]> {
        // Search, and do a join with the channel table to get the channel name
        // Drizzle
        const data = await dbService.query.CustomWidgetsTable
            .findMany({
                where: like(CustomWidgetsTable.widget_name, `%${query.toLowerCase()}%`),
            })

        const publishedBy = []
        const findedChannels: Channel[] = []

        for (const widget of data) {
            if (!findedChannels.find(channel => channel.twitchId === widget.channel_id)) {
                const channel = await Channel.findByTwitchId(widget.channel_id)
                if (!channel) {
                    continue
                }
                findedChannels.push(channel)
            }

            publishedBy.push(findedChannels.find(channel => channel.twitchId === widget.channel_id))
        }

        if (!data) {
            return []
        }

        return data
    }


    async save(): Promise<CustomWidget> {
        const data = await dbService.insert(CustomWidgetsTable)
            .values(this.data)
            .onConflictDoUpdate({
                target: [CustomWidgetsTable.id],
                set: this.data
            })

        return new CustomWidget(this.data)
    }

    async delete(): Promise<void> {
        await dbService.delete(CustomWidgetsTable)
            .where(eq(CustomWidgetsTable.id, this.data.id))
    }

    async publishAsTemplate(): Promise<CustomWidget> {
        this.data.published_as_template = true
        return await this.save()
    }

    async unpublishAsTemplate(): Promise<CustomWidget> {
        this.data.published_as_template = false
        return await this.save()
    }


}