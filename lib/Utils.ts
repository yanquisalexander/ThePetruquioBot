import axios from "axios";
import Channel from "../app/models/Channel.model";
import User from "../app/models/User.model";
import { ExternalAccountProvider } from "../app/models/ExternalAccount.model";
import chalk from "chalk";

const getSpotifyCurrentlyPlayingSong = async (channel: Channel): Promise<any> => {
    const spotifyAccount = await channel.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY)
    if (!spotifyAccount) return null;

    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${spotifyAccount.accessToken}`
        }
    });

    return response.data;
}

const replaceSpotifyVariables = async (command: string, channel: Channel): Promise<string> => {
    const spotifySongRegex = /\${spotify\.song}|\${spotify\.artist}|\${spotify\.url}|\${spotify\.currentPosition}/g;
    const spotifyMatches = command.match(spotifySongRegex);

    if (spotifyMatches !== null) {
        const spotifySong = await getSpotifyCurrentlyPlayingSong(channel);
        console.log('spotifySong:', spotifySong);

        if (!spotifySong) {
            console.log('spotifySong is null');
            return command.replace(spotifySongRegex, '');
        }

        function formatPosition(positionInMilliseconds: number) {
            const seconds = Math.floor(positionInMilliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            const formattedPosition = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;

            return formattedPosition;
        }

        for (const match of spotifyMatches) {
            if (match === "${spotify.song}") {
                console.log('Replacing ${spotify.song}');
                command = command.replace(match, spotifySong?.item.name || '');
            }
            if (match === "${spotify.artist}") {
                console.log('Replacing ${spotify.artist}');
                command = command.replace(match, spotifySong?.item.artists[0].name || '');
            }
            if (match === "${spotify.url}") {
                console.log('Replacing ${spotify.url}');
                // Reemplaza "${spotify.url}" con el valor deseado
                command = command.replace(match, spotifySong?.item.external_urls.spotify || '');
            }
            if (match === "${spotify.currentPosition}") {
                console.log('Replacing ${spotify.currentPosition}');
                // Reemplaza "${spotify.currentPosition}" con el valor formateado deseado
                const formattedPosition = formatPosition(spotifySong?.progress_ms || 0); // Puedes implementar tu propia función de formato
                command = command.replace(match, formattedPosition);
            }

            if (match === "${spotify.duration}") {
                console.log('Replacing ${spotify.duration}');
                // Reemplaza "${spotify.currentPosition}" con el valor formateado deseado
                const formattedPosition = formatPosition(spotifySong?.progress_ms || 0); // Puedes implementar tu propia función de formato
                command = command.replace(match, formattedPosition);
            }
        }
    }

    return command;


}

class Utils {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static emptyString(string: string | undefined): boolean {
        if (string === undefined) return true;
        if (string === '') return true;
        if (string.trim() === '') return true;
        return false;
    }

    public static async replaceVariables(command: string, channel: Channel, user: User, args?: string[]): Promise<string> {
        let toUser = '';
        if (args) {
            toUser = args[0];
        }

        const channelName = channel.user.displayName || channel.user.username;

        // Replace ${channel} with the channel name
        command = command.replace(/\${channel}/g, channelName);

        // Replace ${sender} with the sender's username
        command = command.replace(/\${sender}/g, user.username);

        // Replace ${toUser} with the receiver's username
        command = command.replace(/\${toUser}/g, toUser);

        // Replace Spotify variables
        try {
            command = await replaceSpotifyVariables(command, channel);

        } catch (error) {
            console.error(chalk.red('Error replacing Spotify variables:'), error);
        }
        // Reemplazar ${randomNum VALOR_MIN-VALOR_MAX} con un número aleatorio dentro del rango especificado
        const randomNumRegex = /\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/g;
        const randomNumMatches = command.match(randomNumRegex);
        if (randomNumMatches !== null) {
            for (const match of randomNumMatches) {
                const [, minValue = '0', maxValue = '100'] = match.match(/\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/) ?? [];
                const randomValue = Math.floor(Math.random() * (Number(maxValue) - Number(minValue) + 1)) + Number(minValue);
                command = command.replace(match, `${randomValue}`);
            }
        }

        // Reemplazar ${fetch URL_AQUI} con el contenido de la URL especificada
        const fetchRegex = /\${fetch (.*?)}/g;
        const fetchMatches = command.match(fetchRegex);
        if (fetchMatches) {
            for (const match of fetchMatches) {
                const url = match.match(/\${fetch (.*?)}/)?.[1];
                if (url) {
                    try {
                        const response = await fetch(url);
                        const data = await response.text();
                        command = command.replace(match, data);
                    } catch (error) {
                        console.error(`Error fetching URL: ${url}`, error);
                    }
                }
            }
        }

        return command;
    }
}

export default Utils;
