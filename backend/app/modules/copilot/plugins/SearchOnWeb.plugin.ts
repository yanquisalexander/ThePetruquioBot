import { FunctionDeclarationSchema, FunctionDeclarationSchemaType } from "@google/generative-ai";
import { CopilotPlugin, HandlerArgs } from "./CopilotPlugin";
import Utils from "@/lib/Utils";

export class SearchOnWebPlugin extends CopilotPlugin {
    name = "searchOnWeb"
    description = "Searches the web for the given query and returns the results."
    version = "1.0.0"
    enabled = true
    icon = "fa6-brands-google"
    contextKey = 'webResults'
    private webResults: any


    async handler(data: HandlerArgs): Promise<any> {
        const { query } = data.args
        const webResults = await Utils.googleSearch(query)
        this.webResults = webResults
        return webResults
    }

    getParameters(): FunctionDeclarationSchema | undefined {
        return {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
                query: {
                    type: FunctionDeclarationSchemaType.STRING,
                    description: 'The query to search on the web'
                }
            },
            required: ['query']
        }
    }

    getSuggestedAction() {
        return null
    }

    getTakedAction() {
        return null
    }

    getContextData() {
        return this.webResults
    }
}