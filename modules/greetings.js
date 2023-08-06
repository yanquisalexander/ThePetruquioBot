import SpectatorLocation from "../app/models/SpectatorLocation.js";
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
    "Hey @#username, thanks for being an awesome bot! :D",
];

const tangerinebotRandomGreetings = [
    "Hey #username, i'm your admirer, i love you! :D",
    "Sikorama really was creative when he created you, #username! :D",
    "TangerineBot, you're the best bot ever! :D",
    "I consider you a friend, #username! :D",
];



const broadcasterGreetings = [
    "Hey boss @#username, welcome back! TakeNRG",
    "Hey @#username, thanks for being an awesome broadcaster!",
    "Hello @#username, hope you're having a great stream!",
];

const emotes = [
    "TakeNRG",
    "VoHiYo",
    ":D",
    "HeyGuys",
    "GivePLZ",
    "TPFufun",
    "CoolCat",
    "B)",
];

export const addGreetingToStack = (channel, message, options) => {
    greetingsStack.push({ channel, message, ...options });
};

const canReceiveGreeting = async (channel, username, channelOwner, isUserOnMap) => {
    // Verificar si el usuario es el propietario del canal
    if (username.toLowerCase() === channelOwner.toLowerCase()) {
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            activeUsers[channel][username] = Date.now();
            return false;
        }
        activeUsers[channel][username] = Date.now();
        return true;
    }

    // Comprobar si es un bot conocido
    if (knownBots.includes(username.toLowerCase())) {
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            activeUsers[channel][username] = Date.now();
            return false;
        }
        activeUsers[channel][username] = Date.now();
        return true;
    }

    // Comprobar si el usuario está en el mapa de la comunidad
    if (isUserOnMap) {
        // Comprobar si el usuario ha pasado al menos 6 horas desde su último mensaje
        if (activeUsers[channel][username] && (Date.now() - activeUsers[channel][username]) < cooldown) {
            activeUsers[channel][username] = Date.now();
            return false;
        }
        activeUsers[channel][username] = Date.now();
        return true;
    }

    return false;
};


const getRandomGreeting = (username, isBot = false, lang) => {
    let greetingList;
    if (isBot) {
        if (username.toLowerCase() === 'tangerinebot_') {
            greetingList = tangerinebotRandomGreetings; // PetruquioBot was inspired by TangerineBot, so he loves him and he's his admirer
        } else {
            greetingList = botGreetings;
        }
    }
    else {
        greetingList = greetings;
    }
    const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return greeting.replace("#username", username).replace("#emote", randomEmote);
};

export const getRandomBroadcasterGreeting = (username) => {
    const greeting = broadcasterGreetings[Math.floor(Math.random() * broadcasterGreetings.length)];
    return greeting.replace("#username", username);
};


export {
    getRandomGreeting,
    canReceiveGreeting
};
