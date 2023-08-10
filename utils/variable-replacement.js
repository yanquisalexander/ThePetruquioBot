export const replaceVariables = async ({ commandResponse, channel, username, toUser }) => {

    if (!toUser) {
        toUser = 'username';
    }
    // Reemplazar ${sender} con el nombre de usuario
    commandResponse = commandResponse.replace(/\${sender}/g, `@${username}`);

    // Reemplazar ${touser} con el nombre de usuario del destinatario
    commandResponse = commandResponse.replace(/\${touser}/g, `${toUser}`);

    // Reemplazar ${channel} con el nombre del canal
    commandResponse = commandResponse.replace(/\${channel}/g, `${channel}`);

    // Reemplazar ${mapUrl} con la URL del Community Map
    commandResponse = commandResponse.replace(/\${mapUrl}/g, `https://petruquio.live/c/${channel}/map`);

    // Reemplazar ${randomNum VALOR_MIN-VALOR_MAX} con un número aleatorio dentro del rango especificado
    const randomNumRegex = /\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/g;
    const randomNumMatches = commandResponse.match(randomNumRegex);
    if (randomNumMatches) {
        for (const match of randomNumMatches) {
            const [, minValue = 0, maxValue = 100] = match.match(/\${randomNum(?:\s+(\d+)\s*-\s*(\d+))?}/);
            const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + Number(minValue);
            commandResponse = commandResponse.replace(match, `${randomValue}`);
        }
    }

    // Reemplazar ${fetch URL_AQUI} con el contenido de la URL especificada
    const fetchRegex = /\${fetch (.*?)}/g;
    const fetchMatches = commandResponse.match(fetchRegex);
    if (fetchMatches) {
        for (const match of fetchMatches) {
            const url = match.match(/\${fetch (.*?)}/)[1];
            try {
                const response = await fetch(url);
                const data = await response.text();
                commandResponse = commandResponse.replace(match, data);
            } catch (error) {
                console.error(`Error fetching URL: ${url}`, error);
            }
        }
    }

    return commandResponse;
};

export const messageAsHtml = (message, emotes) => {
    if (!emotes) return message;
    // store all emote keywords
    // ! you have to first scan through 
    // the message string and replace later
    const stringReplacements = [];

    // iterate of emotes to access ids and positions
    Object.entries(emotes).forEach(([id, positions]) => {
        // use only the first position to find out the emote key word
        const position = positions[0];
        const [start, end] = position.split("-");
        const stringToReplace = message.substring(
            parseInt(start, 10),
            parseInt(end, 10) + 1
        );

        stringReplacements.push({
            stringToReplace: stringToReplace,
            replacement: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/3.0" class='map-popup-emote'>`,
        });
    });

    // generate HTML and replace all emote keywords with image elements
    const messageHTML = stringReplacements.reduce(
        (acc, { stringToReplace, replacement }) => {
            // obs browser doesn't seam to know about replaceAll
            return acc.split(stringToReplace).join(replacement);
        },
        message
    );

    return messageHTML;
}