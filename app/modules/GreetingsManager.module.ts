import chalk from "chalk";
import Environment from "../../utils/environment";
import { sunlightGreetings, greetings, birthdayGreetings } from "../constants/Greetings.constants";
import Channel from "../models/Channel.model";
import Greeting from "../models/Greeting.model";
import User from "../models/User.model";
import { Bot } from "../../bot";
import SpectatorLocation from "../models/SpectatorLocation.model";
import SunCalc from "suncalc";
import ct, { Timezone } from 'countries-and-timezones';
import { DateTime, Duration } from 'luxon';


class GreetingsManager {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    /* 
    
    This class is responsible for managing the greetings that are sent to the users.

    */

    private static cooldown = Environment.isDevelopment ? 30 * 1000 : 6 * 60 * 60 * 1000;

    private static knownBotsList: string[] = ["streamelements", "streamlabs", "nightbot", "tangerinebot_"];

    private static greetingStacks: { channel: Channel, greeting: string, options: string[] }[] = [];

    private static botGreetings = [
        "Hey pal @#username, good to see you around, feel safe now :)",
        "Welcome back, @#username! It's always a pleasure to have you here! :D",
        "Hello @#username, I hope you're having a fantastic day!",
        "Hey @#username, thanks for being an awesome bot! :D",
    ];

    private static tangerinebotRandomGreetings = [
        "Hey #username, I'm your admirer, I love you! :D",
        "Sikorama really was creative when he created you, #username! :D",
        "TangerineBot, you're the best bot ever! :D",
        "I consider you a friend, #username! :D",
    ];

    private static broadcasterGreetings = [
        "Hey boss @#username, welcome back! TakeNRG",
        "Hey @#username, thanks for being an awesome broadcaster! #emote",
        "Hello @#username, hope you're having a great stream! ;)",
        "Good to see you around @#username, have a great stream! :D",
        "Have a great stream @#username! #emote",
        "Who is this handsome guy? @#username! #emote"
    ];

    private static emotes = [
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

    private static shouldGreetSunlight() {
        return true
        // 80% of the time, it shouldn't greet based on the time of day
        const random = Math.random();
        return !(random < 0.8)
    }

    private static async getRandomGreetingList(username: string, isBot: boolean, lang: string, isUserBirthday?: boolean) {
        console.log(chalk.blue(`[GREETINGS] Getting random greeting list for ${username}, isBot: ${isBot}, lang: ${lang}`));
        if (isUserBirthday) {
            return birthdayGreetings[lang];
        }
        if (isBot) {
            if (username.toLowerCase() === 'tangerinebot_') {
                return this.tangerinebotRandomGreetings;
            } else {
                return this.botGreetings;
            }
        } else {
            return this.shouldGreetSunlight() ? await this.getSunlightGreeting(username, lang) : greetings[lang];
        }
    }

    private static async getSunlightGreeting(username: string, lang: string): Promise<string[] | undefined> {
        if (!username || !lang) return;

        const user = await User.findByUsername(username);
        if (!user) {
            return greetings[lang];
        }

        const userLocation = await SpectatorLocation.findByUserId(user.twitchId);

        if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
            return greetings[lang];
        }
        let timezone: Timezone | string = 'UTC';
        try {
            const userTimezones = ct.getTimezonesForCountry(userLocation.countryCode || 'US');
            if (userTimezones && userTimezones.length > 0) {
                timezone = userTimezones[0].name;
            }
        } catch (error) {
            console.error(chalk.red('[GREETINGS]'), chalk.white('Error getting timezone:'), error);
        }

        const date = new Date(); // Obtén la fecha y hora actuales en la zona horaria local
        const userTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        
        const times = SunCalc.getTimes(userTime, parseFloat(userLocation.latitude.toString()), parseFloat(userLocation.longitude.toString()));
        const hour = userTime.getHours();

        console.log({
            user: user.username,
            timezone,
            times,
            hour,
            userTime,
            date,
            userLocation,
            latitude: parseFloat(userLocation.latitude.toString()),
        })

        if (hour >= times.sunrise.getHours() && hour < times.sunriseEnd.getHours()) {
            return sunlightGreetings[lang].morning
        } else if (hour >= times.sunriseEnd.getHours() && hour < times.sunset.getHours()) {
            return sunlightGreetings[lang].afternoon
        } else if (hour >= times.sunset.getHours() && hour < times.sunset.getHours()) {
            return sunlightGreetings[lang].evening
        } else {
            return sunlightGreetings[lang].night
        }
    }

    public static async getRandomGreeting(username: string, isBot: boolean, lang: string, isUserBirthday?: boolean) {
        const greetingList = await this.getRandomGreetingList(username, isBot, lang, isUserBirthday);
        // @ts-expect-error
        const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
        const randomEmote = this.emotes[Math.floor(Math.random() * this.emotes.length)];
        return greeting.replace("#username", username).replace("#emote", randomEmote);
    }

    public static async canReceiveShoutoutGreeting(channel: Channel, user: User) {
        let greetingData = await Greeting.findByChannel(channel, user);
        if (!greetingData) {
            try {
                await Greeting.create(user, channel, new Date(), new Date(), true);
                return true;
            } catch (error) {
                console.error(chalk.red('[GREETINGS]'), chalk.white('Error creating greeting:'), error);
            }
            return false
        }

        if (greetingData.shoutoutedAt && (Date.now() - greetingData.shoutoutedAt.getTime()) < this.cooldown) {
            await Greeting.updateShoutoutTimestamp(user, channel);
            return false;
        }
        await Greeting.updateShoutoutTimestamp(user, channel)
        return true;
    }

    public static async canReceiveGreeting(channel: Channel, user: User | null, userOnMap: boolean | SpectatorLocation | null) {
        if (!user) return false;

        let greetingData = await Greeting.findByChannel(channel, user);
        if (!greetingData) {
            try {
                await Greeting.create(user, channel, new Date(), null, true);
                return Boolean(userOnMap)
            } catch (error) {
                console.error(chalk.red('[GREETINGS]'), chalk.white('Error creating greeting:'), error);
            }
            return false
        }
        if (!greetingData.enabled) return false;

        if (user.username === channel.user.username) {
            if (greetingData.lastSeen && (Date.now() - greetingData.lastSeen.getTime()) < this.cooldown) {
                await Greeting.updateTimestamp(user, channel);

                return false;
            }
            await Greeting.updateTimestamp(user, channel);
            return true;
        }

        if (this.knownBotsList.includes(user.username)) {
            if (greetingData.lastSeen && (Date.now() - greetingData.lastSeen.getTime()) < this.cooldown) {
                await Greeting.updateTimestamp(user, channel);
                return false;
            }
            await Greeting.updateTimestamp(user, channel);
            return true;
        }

        if (userOnMap) {
            if (greetingData.lastSeen && (Date.now() - greetingData.lastSeen.getTime()) < this.cooldown) {
                await Greeting.updateTimestamp(user, channel);
                return false;
            }
            await Greeting.updateTimestamp(user, channel);
            return true;
        }

        return false;
    }

    public static getRandomBroadcasterGreeting(username: string) {
        const greeting = this.broadcasterGreetings[Math.floor(Math.random() * this.broadcasterGreetings.length)];
        const randomEmote = this.emotes[Math.floor(Math.random() * this.emotes.length)];
        return greeting.replace("#username", username).replace("#emote", randomEmote);
    }

    public static addToGreetingStack(channel: Channel, greeting: string, ...options: string[]) {
        console.log(chalk.yellow(`[GREETINGS] Adding to stack: ${greeting} for channel #${channel.user.displayName}, options: ${options.join(', ')}`));
        this.greetingStacks.push({ channel, greeting, options });
    }

    public static initialize() {
        console.log(chalk.green('[GREETINGS]'), chalk.white('Initialized.'));
        setInterval(async () => {
            try {
                if (this.greetingStacks.length > 0) {
                    const greeting = this.greetingStacks.shift();
                    const bot = await Bot.getInstance();
                    if (!greeting) return;
                    bot.sendMessage(greeting.channel, greeting.greeting);
                }
            } catch (error) {
                console.error(chalk.red('[GREETINGS]'), chalk.white('Error sending greeting:'), error);
            }
        }, 10 * 1000);
    }


    public static get knownBots(): string[] {
        return GreetingsManager.knownBotsList;
    }


}

export default GreetingsManager;