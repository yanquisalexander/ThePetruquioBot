import { Command, CommandPermission } from "../models/Command.model";
import SpectatorLocation from "../models/SpectatorLocation.model";
import User from "../models/User.model";
import WorldMap from "../models/WorldMap.model";
import SocketIO from "../modules/SocketIO.module";



const ShowCommand = new Command(
    'show',
    '*',
    [CommandPermission.EVERYONE],
    'Permite al espectador mostrar su ubicación en el mapa de la comunidad.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        if(!_channel.preferences.enableCommunityMap) return;

        const user = await User.findByTwitchId(_user.id);

        if(!user) return;

        const userLocation = await SpectatorLocation.findByUserId(user.twitchId);

        if(!userLocation) {
            _bot.sendMessage(_channel, `@${_user.displayName}, parece que no tengo tu ubicación registrada. Puedes registrarla con el comando !from <ciudad, país> PopNemo`);
            return;
        } else {
            let worldmapUser = await WorldMap.find(user.twitchId, _channel.user.twitchId);



            if(!worldmapUser) {
                const newWorldmapUser = new WorldMap({
                    channelId: _channel.user.twitchId,
                    userId: user.twitchId,
                    masked: false,
                    showOnMap: true,
                    pinEmote: null,
                    pinMessage: null
                })

                await newWorldmapUser.save();

                SocketIO.getInstance().emitEvent(`map:${_channel.user.username}`, 'user-updated', {
                    type: 'show',
                    username: _user.username,
                    user_id: user.twitchId,
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    user_username: user.username,
                    user_display_name: user.displayName,
                    masked: false,
                    pin_message: null,
                    pin_emote: null
                });

                _bot.sendMessage(_channel, `@${_user.displayName}, listo! Tu ubicación se mostrará en el mapa de la comunidad PopNemo`);
            }

            if(worldmapUser) {
                worldmapUser.showOnMap = true;
                worldmapUser.masked = false;
                await worldmapUser.save();

                SocketIO.getInstance().emitEvent(`map:${_channel.user.username}`, 'user-updated', {
                    type: 'show',
                    username: _user.username,
                    user_id: user.twitchId,
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    user_username: user.username,
                    user_display_name: user.displayName,
                    masked: false,
                    pin_message: worldmapUser.pinMessage,
                    pin_emote: worldmapUser.pinEmote
                });

                _bot.sendMessage(_channel, `@${_user.displayName}, listo! Tu ubicación se mostrará en el mapa de la comunidad PopNemo`);
            }
        }

        
       
    }
);

export default ShowCommand;