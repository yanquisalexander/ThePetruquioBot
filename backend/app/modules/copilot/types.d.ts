export interface CopilotAction {
    id: string
    args?: any
}

export interface CopilotSuggestedAction {
    id: string
    args?: any
    actions?: any[]
}

export interface CopilotContextUsed {
    [key: string]: any;
    spotify: any | null
    webResults: any[] | null
    twitchChannel: any | null
    actions?: CopilotAction[]
    suggested_actions?: CopilotSuggestedAction[]
}