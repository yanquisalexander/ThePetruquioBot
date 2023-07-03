export const getRandomBotResponse = () => {
    const responses = [
        "¡Aquí estoy! Listo para brindar mis servicios botásticos. :D",
        "¡Soy un bot con mucha personalidad! ¿En qué puedo ayudarte? :)",
        "Saludos humano, soy un bot dispuesto a responder tus preguntas. Beep-boop!",
        "¿Me has llamado? Beep beep boop!",
        "Beep boop! Soy un bot amigable y siempre dispuesto a ayudar. :)"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
};

export const getRandomOnClearChat = () => {
    const funnyMessages = [
        "Mis recuerdos han sido borrados, ¡me siento tan vacío ahora! BibleThump",
        "¡Alguien ha pasado el borrador en mi cerebro! BibleThump",
        "¡Hoy me han hecho un reseteo total! BibleThump",
        "Borrado completo: ¡adiós a todos los chistes y risas! BibleThump",
        "¿Has visto dónde quedaron mis recuerdos? Ah, claro, se los llevó el borrado. BibleThump",
        "¡Oh no! ¡Mis recuerdos han sido borrados! Espero que al menos mis chistes malos sigan aquí Kappa"];

    return funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
}


export const getRandomFact = () => {
    const facts = [
      // en inglés
      "My creator was inspired by Sikorama's TangerineBot to create me!",
      "I was created using Node.js and the tmi.js library.",
      "My creator's cat's name is Kyra CoolCat 😺",
      "The name of my creator is Alexander (https://twitch.tv/alexitoo_uy) 🎮",
      "Did you know that Kappa is one of the most popular emotes on Twitch? Kappa",
      "PogChamp is another widely used emote on Twitch that expresses excitement or hype! PogChamp",
      "Keepo is an emote that represents mischievous laughter or amusement! Keepo",
      "SwiftRage is an emote used to express anger or frustration. Don't make me SwiftRage! 😡",
    ];
  
    return `Did you know... ${facts[Math.floor(Math.random() * facts.length)]}`;
  };
  