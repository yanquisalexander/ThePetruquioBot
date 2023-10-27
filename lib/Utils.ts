import Channel from "../app/models/Channel.model";
import User from "../app/models/User.model";

class Utils {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static emptyString(string: string | undefined): boolean {
        if (string === undefined) return true;
        if (string === '') return true;
        return false;
    }

    public static async replaceVariables(commandResponse: string, channel: Channel, user: User, args?: string[]): Promise<string> {

        let toUser = '';
        if (args) {
            toUser = args[0]
        }


        const channelName = channel.user.displayName || channel.user.username;

        // Replace ${channel} with the channel name
        commandResponse = commandResponse.replace(/\${channel}/g, channelName);

        // Replace ${sender} with the sender's username
        commandResponse = commandResponse.replace(/\${sender}/g, user.username);

        // Replace ${toUser} with the receiver's username
        commandResponse = commandResponse.replace(/\${toUser}/g, toUser);

        // Reemplazar ${randomNum VALOR_MIN-VALOR_MAX} con un número aleatorio dentro del rango especificado
        const randomNumRegex = /\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/g;
        const randomNumMatches = commandResponse.match(randomNumRegex);
        if (randomNumMatches !== null) {
            for (const match of randomNumMatches) {
                const [, minValue = '0', maxValue = '100'] = match.match(/\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/) ?? [];
                const randomValue = Math.floor(Math.random() * (Number(maxValue) - Number(minValue) + 1)) + Number(minValue);
                commandResponse = commandResponse.replace(match, `${randomValue}`);
            }
        }

        // Reemplazar ${fetch URL_AQUI} con el contenido de la URL especificada
        const fetchRegex = /\${fetch (.*?)}/g;
        const fetchMatches = commandResponse.match(fetchRegex);
        if (fetchMatches) {
            for (const match of fetchMatches) {
                const url = match.match(/\${fetch (.*?)}/)?.[1];
                if (url) {
                    try {
                        const response = await fetch(url);
                        const data = await response.text();
                        commandResponse = commandResponse.replace(match, data);
                    } catch (error) {
                        console.error(`Error fetching URL: ${url}`, error);
                    }
                }
            }
        }

        return commandResponse;

    }
}

export default Utils;