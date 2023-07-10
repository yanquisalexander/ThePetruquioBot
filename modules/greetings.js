import { Bot } from "../bot.js";
import { activeUsers, greetingsStack } from "../memory_variables.js";
import { isFollower, knownBots } from "../utils/twitch.js";

const cooldown = 21600000; // 6 hours

const greetings = [
    "Hola que tal, @#username? #emote",
    "¡Bienvenido/a, @#username! #emote",
    "Saludos, @#username. ¿Cómo estás? #emote",
    "Hola @#username, ¡qué bueno verte por aquí! #emote",
];

const botGreetings = [
    "Hey pal @#username, good to see you around, feel safe now :)",
    "Welcome back, @#username! It's always a pleasure to have you here! :D",
    "Hello @#username, I hope you're having a fantastic day!",
];

const broadcasterGreetings = [
    "Hey boss @#username, welcome back! TakeNRG",
    "Hey @#username, thanks for being an awesome broadcaster!",
    "Hello @#username, hope you're having a great stream!",
];

const emotes = [
    "TakeNRG",
    "VoHiYo",
    ":D"
];

export const addGreetingToStack = (channel, message, options) => {
    greetingsStack.push({ channel, message, ...options });
};

const canReceiveGreeting = (channel, username, channelOwner) => {
    if (username.toLowerCase() === 'alexitoo_uy' && channelOwner.toLowerCase() !== 'alexitoo_uy') {
        // Verificar si el usuario es el creador del bot
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            return false;
        }
        addGreetingToStack(channel, 'Meet Alexitoo, my creator. They are a talented individual who has brought me to life! Make sure to check out their channel and show them some love. twitch.tv/alexitoo_uy');
    }

    // Verificar si el usuario es el propietario del canal
    if (username.toLowerCase() === channelOwner.toLowerCase()) {
        // Verificar si ha pasado el cooldown para el propietario del canal
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            return false;
        }
        // Realizar acciones especiales para el propietario del canal, como enviar un mensaje personalizado
        addGreetingToStack(channel, getRandomBroadcasterGreeting(username));
        activeUsers[channel][username] = Date.now(); // Actualizar el tiempo del último mensaje del propietario del canal
        return false;
    }


    // Comprobar si el usuario es seguidor del canal
    if (isFollower(username, channel.slice(1))) {
        // Comprobar si el usuario ha pasado al menos 6 horas desde su último mensaje
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            return false;
        }
        return true;
    }

    // Comprobar si es un bot conocido
    if (knownBots.includes(username.toLowerCase())) {
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            return false;
        }
        return true;
    }

    return false;
};

const getRandomGreeting = (username, isBot = false) => {
    const greetingList = isBot ? botGreetings : greetings;
    const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return greeting.replace("#username", username).replace("#emote", randomEmote);
};

const getRandomBroadcasterGreeting = (username) => {
    const greeting = broadcasterGreetings[Math.floor(Math.random() * broadcasterGreetings.length)];
    return greeting.replace("#username", username);
};


export {
    getRandomGreeting,
    canReceiveGreeting
};
