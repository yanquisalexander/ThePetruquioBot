import { CustomWidgetsTable } from '@/db/schema'
import { dbService } from '../services/Database'
import Channel from './Channel.model'
import { and, eq, ilike, like } from 'drizzle-orm'

interface CustomWidgetData {
    id: string
    channel_id: number
    widget_name: string
    widget_description?: string | null
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
            description: CustomWidgetsTable.widget_description,
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
        // Buscar widgets personalizados que coincidan con el query y estén publicados como plantillas
        const widgets = await dbService.query.CustomWidgetsTable.findMany({
            where: and(ilike(CustomWidgetsTable.widget_name, `%${query.toLowerCase()}%`), eq(CustomWidgetsTable.published_as_template, true)),
            limit: 20
        });

        // Obtener los nombres de los canales asociados a cada widget
        const channelIds = widgets.map(widget => widget.channel_id);
        const channels = await Promise.all(channelIds.map(channelId => Channel.findByTwitchId(channelId)));

        // Asociar cada widget con su respectivo canal
        const widgetsWithChannelName = widgets.map(widget => {
            const channel = channels.find(channel => channel?.twitchId === widget.channel_id);
            const publishedBy = channel ? channel : null;
            return { ...widget, published_by: publishedBy?.user };
        });

        return widgetsWithChannelName;
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