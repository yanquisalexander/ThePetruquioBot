import { greetings, sunlightGreetings } from "../app/constants/greeting-list.js";
import SpectatorLocation from "../app/models/SpectatorLocation.js";
import { Bot } from "../bot.js";
import { activeUsers, greetingsStack, shoutoutedUsers } from "../memory_variables.js";
import { isFollower, knownBots } from "../utils/twitch.js";
import SunCalc from "suncalc";


const cooldown = 21600000; // 6 hours





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
    "Hey @#username, thanks for being an awesome broadcaster! #emote",
    "Hello @#username, hope you're having a great stream! ;)",
    "Good to see you around @#username, have a great stream! :D",
    "Have a great stream @#username! #emote",
    "Who is this handsome guy? @#username! #emote"
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
    ";)"
];

export const addGreetingToStack = (channel, message, options) => {
    greetingsStack.push({ channel, message, ...options });
};

export const canReceiveShoutoutGreeting = (channel, username) => {
    if (shoutoutedUsers[channel][username] && (Date.now() - shoutoutedUsers[channel][username]) < cooldown) {
        shoutoutedUsers[channel][username] = Date.now();
        return false;
    }
    shoutoutedUsers[channel][username] = Date.now();
    return true;
}


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

const shouldGreetSunlight = () => {
    // El 80% de las veces no debe saludar basado en la hora del día
    const random = Math.random();
    if (random < 0.8) {
        return false;
    }
    return true;
};



const getRandomGreeting = async (username, isBot = false, lang) => {
    // default language is english (en)
    let greetingList;
    if (isBot) {
        if (username.toLowerCase() === 'tangerinebot_') {
            greetingList = tangerinebotRandomGreetings; // PetruquioBot was inspired by TangerineBot, so he loves him and he's his admirer
        } else {
            greetingList = botGreetings;
        }
    } else {
        if (shouldGreetSunlight()) {
            const location = await SpectatorLocation.find(username);
            if (!location) {
                greetingList = greetings[lang];
            } else {
                const date = new Date();
                const times = SunCalc.getTimes(date, location.latitude, location.longitude);
                const hour = date.getHours();
                // Devolver morning, afternoon, evening o night
                if (hour >= times.sunrise.getHours() && hour < times.sunriseEnd.getHours()) {
                    greetingList = sunlightGreetings[lang].morning;
                } else if (hour >= times.sunriseEnd.getHours() && hour < times.sunset.getHours()) {
                    greetingList = sunlightGreetings[lang].afternoon;
                } else if (hour >= times.sunset.getHours() && hour < times.sunset.getHours()) {
                    greetingList = sunlightGreetings[lang].evening;
                } else {
                    greetingList = sunlightGreetings[lang].night;
                }
            }
        } else {
            greetingList = greetings[lang];
        }
    }

    const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return greeting.replace("#username", username).replace("#emote", randomEmote);
};


export const getRandomBroadcasterGreeting = (username) => {
    const greeting = broadcasterGreetings[Math.floor(Math.random() * broadcasterGreetings.length)];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return greeting.replace("#username", username).replace("#emote", randomEmote);
};


export {
    getRandomGreeting,
    canReceiveGreeting
};
