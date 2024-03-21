import { CoreWidgetsTable } from '@/db/schema'
import { dbService } from '../services/Database'
import { type UUID } from 'crypto'
import Channel from './Channel.model'
import { eq } from 'drizzle-orm'

export const WidgetType = {
  COMMAND_BANNER_ROTATOR: 'COMMAND_BANNER_ROTATOR',
  CHAT_WIDGET: 'CHAT_WIDGET'
}

export interface CommandBannerRotatorPreferences {
  banners: Array<{
    command: string
    html: string
    javascript?: string
    css?: string
    duration: number
  }>
}

export interface ChatWidgetPreferences {
  messageDisplayDuration: number
  messageLimit: number
  customCss?: string
}

export type CoreWidgetPreferences =
| CommandBannerRotatorPreferences
| ChatWidgetPreferences

interface CoreWidgetData {
  id: UUID
  widget_type: typeof WidgetType[keyof typeof WidgetType]
  channel: Channel
  preferences: CoreWidgetPreferences
  created_at?: Date
  updated_at?: Date
}

export class CoreWidget {
  id: UUID
  widgetType: typeof WidgetType[keyof typeof WidgetType]
  channel: Channel
  preferences: Record<string, any>
  createdAt?: Date
  updatedAt?: Date

  constructor (data: CoreWidgetData) {
    this.id = data.id
    this.widgetType = data.widget_type
    this.channel = data.channel
    this.preferences = data.preferences
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  public async save (): Promise<CoreWidget> {
    try {
      await dbService.insert(CoreWidgetsTable)
        .values({
          id: this.id,
          widget_type: this.widgetType,
          channel_id: this.channel.twitchId,
          preferences: this.preferences
        })
        .onConflictDoUpdate({
          target: [CoreWidgetsTable.id],
          set: {
            widget_type: this.widgetType,
            channel_id: this.channel.twitchId,
            preferences: this.preferences
          }
        })

      return this
    } catch (error) {
      throw new Error(`Error saving CoreWidget: ${(error as Error).message}`)
    }
  }

  public async delete (): Promise<void> {
    try {
      await dbService.delete(CoreWidgetsTable)
        .where(eq(CoreWidgetsTable.id, this.id))
    } catch (error) {
      throw new Error(`Error deleting CoreWidget: ${(error as Error).message}`)
    }
  }

  public static async findById (id: UUID): Promise<CoreWidget | null> {
    try {
      const result = await dbService.select()
        .from(CoreWidgetsTable)
        .where(eq(CoreWidgetsTable.id, id))

      if (result.length === 0) return null
      const channel = await Channel.findByTwitchId(result[0].channel_id)

      if (!channel) return null

      return new CoreWidget({
        id: result[0].id as UUID,
        widget_type: result[0].widget_type,
        preferences: result[0].preferences as CoreWidgetPreferences,
        channel
      })
    } catch (error) {
      throw new Error(`Error finding CoreWidget by id: ${(error as Error).message}`)
    }
  }

  public static async findByChannel (channel: Channel): Promise<CoreWidget[] | null> {
    try {
      const result = await dbService.query.CoreWidgetsTable
        .findMany({
          where: eq(CoreWidgetsTable.channel_id, channel.twitchId)
        })

      if (result.length === 0) return null

      return result.map((widget) => new CoreWidget({
        id: widget.id as UUID,
        widget_type: widget.widget_type,
        preferences: widget.preferences as CoreWidgetPreferences,
        channel
      }))
    } catch (error) {
      throw new Error(`Error finding CoreWidget by channel: ${(error as Error).message}`)
    }
  }
}
