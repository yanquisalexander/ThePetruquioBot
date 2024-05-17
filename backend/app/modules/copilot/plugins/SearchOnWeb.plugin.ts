import { FunctionDeclarationSchema, FunctionDeclarationSchemaType } from "@google/generative-ai";
import { CopilotPlugin } from "./CopilotPlugin";

export class SearchOnWebPlugin extends CopilotPlugin {
    name = "searchOnWeb"
    description = "Searches the web for the given query and returns the results."
    version = "1.0.0"
    enabled = true
    icon = "fa6-brands-google"
    contextKey = 'web_results'


    async handler(args: any): Promise<any> {
        return {
            data: {
                result: 'Search on Web' // Placeholder to test the plugin
            }
        }
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
        return null
    }
}