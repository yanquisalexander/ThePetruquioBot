import { Command, CommandPermission } from "../models/Command.model";
import Twitch from "../modules/Twitch.module";

const getRandomFact = () => {
    const facts = [
      "My creator was inspired by Sikorama's TangerineBot to create me!",
      "I was created using NodeJS and the tmijs library.",
      "My creator's cat's name is Kyra CoolCat 😺",
      "The name of my creator is Alexander (https://twitch.tv/alexitoo_uy) 🎮",
      "Did you know that Kappa is one of the most popular emotes on Twitch? Kappa",
      "PogChamp is another widely used emote on Twitch that expresses excitement or hype! PogChamp",
      "Keepo is an emote that represents mischievous laughter or amusement! Keepo",
      "SwiftRage is an emote used to express anger or frustration. Don't make me SwiftRage! 😡",
    ];
  
    return `Did you know... ${facts[Math.floor(Math.random() * facts.length)]}`;
  };

const RandomMessageCommand = new Command(
    'random',
    '*',
    [CommandPermission.EVERYONE],
    'Devuelve un mensaje aleatorio.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        _bot.sendMessage(_channel, `@${_user.displayName}, ${getRandomFact()}`);
        return;
    }
);

export default RandomMessageCommand;