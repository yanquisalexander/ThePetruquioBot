import Channel from "@/app/models/Channel.model"
import User from "@/app/models/User.model"
import { FunctionDeclarationSchema } from "@google/generative-ai"
import { CopilotAction, CopilotSuggestedAction } from "../types"
import { Bot } from "@/bot"

export interface HandlerArgs {
    bot: Bot
    user: User
    channel: Channel
    args: any
}

export abstract class CopilotPlugin {
    abstract name: string
    abstract description: string
    abstract version: string
    abstract enabled: boolean
    abstract icon: string
    abstract contextKey: string

    abstract handler(data: HandlerArgs): Promise<any>
    abstract getParameters(): FunctionDeclarationSchema | undefined
    abstract getSuggestedAction(): CopilotSuggestedAction | null
    abstract getTakedAction(): CopilotAction | null
    abstract getContextData(): any

    release() {
        // @ts-ignore
        delete this
    }
}