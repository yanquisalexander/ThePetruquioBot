import { CustomWidgetsTable } from '@/db/schema'
import { dbService } from '../services/Database'
import Channel from './Channel.model'
import { eq } from 'drizzle-orm'

interface CustomWidgetData {
    id: string
    channel_id: number
    widget_name: string
    custom_html?: string | null
    custom_css?: string | null
    custom_js?: string | null
    properties?: any
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

    async save(): Promise<CustomWidget> {
        const data = await dbService.insert(CustomWidgetsTable)
            .values(this.data)
            .onConflictDoUpdate({
                target: [CustomWidgetsTable.id],
                set: this.data
            })

        return new CustomWidget(this.data)
    }
}