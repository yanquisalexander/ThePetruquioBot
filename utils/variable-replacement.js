export const replaceVariables = async ({ commandResponse, channel, username, toUser }) => {

    if (!toUser) {
        toUser = username;
    }
    // Reemplazar ${sender} con el nombre de usuario
    commandResponse = commandResponse.replace(/\${sender}/g, `@${username}`);

    // Reemplazar ${touser} con el nombre de usuario del destinatario
    commandResponse = commandResponse.replace(/\${touser}/g, `${toUser}`);

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
