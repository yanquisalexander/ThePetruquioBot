import MemoryVariables from "../../lib/MemoryVariables";
import { Command, CommandPermission } from "../models/Command.model";

const StoryCommand = new Command(
    'story',
    '*',
    [CommandPermission.VIEWER],
    'Añade una contribución a la historia.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
       if(!MemoryVariables.getCurrentBook(_channel.twitchId)) {
              _bot.sendMessage(_channel, `@${_user.displayName}, the streamer hasn't opened a book yet BibleThump`);
              return;
       }
    }
);

export default StoryCommand;