import { Command, CommandPermission } from "../models/Command.model";
import User from "../models/User.model";
import Twitch from "../modules/Twitch.module";


const UserUpdateCommand = new Command(
    'user-update',
    '*',
    [CommandPermission.EVERYONE],
    'Actualiza los datos del usuario en la base de datos.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const user = await User.findByTwitchId(_user.id);

        if (!user) {
            return;
        }

        const twitchUser = await Twitch.Helix.users.getUserById(_user.id);

        user.username = _user.username;
        user.displayName = _user.displayName;
        user.avatar = twitchUser?.profilePictureUrl;

        try {
            await user.save();
            _bot.sendMessage(_channel, `@${_user.displayName}, tus datos fueron actualizados correctamente VoHiYo`);

        } catch (error) {
            console.error(error);
            _bot.sendMessage(_channel, `@${_user.username}, ha ocurrido un error al actualizar tus datos BibleThump`);
        }

        return;
    }
);

export default UserUpdateCommand;