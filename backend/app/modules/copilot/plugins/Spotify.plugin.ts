import { ExternalAccountProvider } from "@/app/models/ExternalAccount.model"
import { CopilotPlugin, HandlerArgs } from "./CopilotPlugin"
import { getSpotifyCurrentlyPlayingSong } from "@/lib/Utils"
import { FunctionDeclarationSchema } from "@google/generative-ai"

export class SpotifyPlugin extends CopilotPlugin {
    name = "spotify"
    description = "Copilot plugin to interact with Spotify, such as getting the current song playing."
    version = "1.0.0"
    enabled = true
    icon = "fa6-brands-spotify"
    contextKey = 'spotify'

    private contextData: any = null

    async handler(data: HandlerArgs): Promise<any> {
        try {
            const usarHasSpotify = await data.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY)
            if (!usarHasSpotify) {
                return {
                    data: {
                        error: 'User does not have Spotify linked'
                    }
                }
            }

            const currentSong = await getSpotifyCurrentlyPlayingSong(data.channel)
            this.contextData = currentSong
            return currentSong
        } catch (error) {
            return {
                data: {
                    error: 'Error getting Spotify data, please try again later'
                }
            }
        }
    }

    getParameters(): FunctionDeclarationSchema | undefined {
        return undefined
    }

    getSuggestedAction() {
        return null
    }

    getTakedAction() {
        return null
    }

    getContextData() {
        return this.contextData
    }
}