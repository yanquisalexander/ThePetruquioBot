import axios, { AxiosError } from "axios";
import Channel from "../app/models/Channel.model";
import User from "../app/models/User.model";
import { ExternalAccountProvider } from "../app/models/ExternalAccount.model";
import chalk from "chalk";

export const getSpotifyCurrentlyPlayingSong = async (channel: Channel, retryAttempts = 3): Promise<any> => {
    try {
        const spotifyAccount = await channel.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY);
        if (!spotifyAccount) return null;

        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${spotifyAccount.accessToken}`
            }
        });


        return response.data;
    } catch (error) {
        console.error(chalk.red('Error getting Spotify currently playing song:'), error);
        if ((error as AxiosError).response && (error as AxiosError).response?.status === 401 && retryAttempts > 0) {
            console.log(chalk.yellow(`Spotify access token expired. Refreshing token. Attempts left: ${retryAttempts}`));
            await Utils.refreshSpotifyToken(channel);
            return await getSpotifyCurrentlyPlayingSong(channel, retryAttempts - 1);
        } else if ((error as AxiosError).response && (error as AxiosError).response?.status === 401 && retryAttempts === 0) {
            console.log(chalk.red('Spotify access token expired. Could not refresh token'));
            return null;
        }
        return null;
    }
};


const replaceSpotifyVariables = async (command: string, channel: Channel): Promise<string> => {
    const spotifySongRegex = /\${spotify\.song}|\${spotify\.artist}|\${spotify\.url}|\${spotify\.currentPosition}|\${spotify\.hasSong}/g;
    const spotifyMatches = command.match(spotifySongRegex);

    if (spotifyMatches !== null) {
        const spotifySong = await getSpotifyCurrentlyPlayingSong(channel);



        if (!spotifySong) {
            console.log('spotifySong is null');
        }

        function formatPosition(positionInMilliseconds: number) {
            const seconds = Math.floor(positionInMilliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            const formattedPosition = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;

            return formattedPosition;
        }

        for (const match of spotifyMatches) {
            if (match === "${spotify.hasSong}") {
                console.log('Replacing ${spotify.hasSong}');
                // Reemplaza "${spotify.hasSong}" con el valor deseado
                command = command.replace(match, spotifySong?.is_playing ? 'true' : 'false');
            }
            if (match === "${spotify.song}") {
                console.log('Replacing ${spotify.song}');
                command = command.replace(match, spotifySong?.item?.name || '');
            }
            if (match === "${spotify.artist}") {
                console.log('Replacing ${spotify.artist}');
                command = command.replace(match, spotifySong?.item?.artists[0]?.name || '');
            }
            if (match === "${spotify.url}") {
                console.log('Replacing ${spotify.url}');
                // Reemplaza "${spotify.url}" con el valor deseado
                command = command.replace(match, spotifySong?.item?.external_urls?.spotify || '');
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

    public static async replaceVariables(message: string, channel: Channel, user: User, args?: string[]): Promise<string> {
        let toUser = '';
        if (args) {
            toUser = args[0];
        }

        const channelName = channel.user.displayName || channel.user.username;

        // Replace ${channel} with the channel name
        message = message.replace(/\${channel}/g, channelName);

        // Replace ${sender} with the sender's username
        message = message.replace(/\${sender}/g, user.username);

        // Replace ${toUser} with the receiver's username
        message = message.replace(/\${toUser}/g, toUser);

        // Replace Spotify variables
        try {
            message = await replaceSpotifyVariables(message, channel);

        } catch (error) {
            console.error(chalk.red('Error replacing Spotify variables:'), error);
        }
        // Reemplazar ${randomNum VALOR_MIN-VALOR_MAX} con un número aleatorio dentro del rango especificado
        const randomNumRegex = /\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/g;
        const randomNumMatches = message.match(randomNumRegex);
        if (randomNumMatches !== null) {
            for (const match of randomNumMatches) {
                const [, minValue = '0', maxValue = '100'] = match.match(/\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/) ?? [];
                const randomValue = Math.floor(Math.random() * (Number(maxValue) - Number(minValue) + 1)) + Number(minValue);
                message = message.replace(match, `${randomValue}`);
            }
        }

        // Reemplazar ${fetch URL_AQUI} con el contenido de la URL especificada
        const fetchRegex = /\${fetch (.*?)}/g;
        const fetchMatches = message.match(fetchRegex);
        if (fetchMatches) {
            for (const match of fetchMatches) {
                const url = match.match(/\${fetch (.*?)}/)?.[1];
                if (url) {
                    try {
                        const response = await fetch(url);
                        const data = await response.text();
                        message = message.replace(match, data);
                    } catch (error) {
                        console.error(`Error fetching URL: ${url}`, error);
                    }
                }
            }
        }

        // Reemplazar ${jseval(VALOR)} con el resultado de eval(VALOR)
        const jsevalRegex = /\${jseval\(([\s\S]*?)\)}/g;
        const jsevalMatches = Array.from(message.matchAll(jsevalRegex));

        let results = [];

        for (const match of jsevalMatches) {
            const [, value = ''] = match;

            try {
                console.log('Ejecutando código JavaScript:', value);
                // Ejecuta el código y guarda el resultado
                const result = new Function(value)();
                results.push(result);
                console.log('Resultado de ejecución:', result);
            } catch (error) {
                console.error('Error al ejecutar código JavaScript:', error);
                message = `Looks like there was an error executing the jseval code: ${error}`;
            }
        }

        // Reemplaza cada coincidencia individualmente con su respectivo resultado
        for (let i = 0; i < jsevalMatches.length; i++) {
            const match = jsevalMatches[i];
            const result = results[i];
            message = message.replace(match[0], result);
            console.log('Reemplazando ${jseval(...)} por', result);
        }

        console.log('Mensaje final:', message);




        return message;
    }

    public static async refreshSpotifyToken(channel: Channel): Promise<void> {
        const spotifyAccount = await channel.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY)
        if (!spotifyAccount) return;
        console.log(chalk.yellow("[SPOTIFY]"), chalk.white(`Trying to refresh Spotify access token for user ${channel.user.username}`));

        const response = await axios.post('https://accounts.spotify.com/api/token', {
            grant_type: 'refresh_token',
            refresh_token: spotifyAccount.refreshToken,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            }
        });


        if (response.status !== 200) {
            console.error(chalk.red('Error refreshing Spotify access token:'), response.data);
            return;
        }

        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        await spotifyAccount.update(newAccessToken, newRefreshToken);
    }
}

export default Utils;
