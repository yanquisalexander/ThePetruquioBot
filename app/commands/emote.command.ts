import Utils from "../../lib/Utils";
import { Command, CommandPermission } from "../models/Command.model";
import SpectatorLocation from "../models/SpectatorLocation.model";
import User from "../models/User.model";
import WorldMap from "../models/WorldMap.model";
import SocketIO from "../modules/SocketIO.module";
import Twitch from "../modules/Twitch.module";



const MapEmoteCommand = new Command(
    'emote',
    '*',
    [CommandPermission.VIEWER],
    'Permite al espectador cambiar su emote en el mapa de la comunidad.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        if(!_channel.preferences.enableCommunityMap?.value) return;

        const user = await User.findByTwitchId(_user.id);

        if(!user) return;

        const userLocation = await SpectatorLocation.findByUserId(user.twitchId);

        if(!userLocation) {
            _bot.sendMessage(_channel.user.username, `@${_user.displayName}, parece que no tengo tu ubicación registrada. Puedes registrarla con el comando !from <ciudad, país> PopNemo`);
            return;
        } else {
            let worldmapUser = await WorldMap.find(user.twitchId, _channel.user.twitchId);



            if(!worldmapUser) {
                
                _bot.sendMessage(_channel.user.username, `@${_user.displayName}, parece que no haz utilizado el comando !show, por lo que no puedo cambiar tu pin :(`);
            }

            if(worldmapUser) {
                if(!_args[0]) return _bot.sendMessage(_channel.user.username, `@${_user.displayName}, debes especificar un emote para tu pin.`);
                let emote = '!emote ' + _args[0]
                let emoteUrl = await Twitch.parseEmotes(_channel, emote, _user.raw, true)
                emoteUrl = emoteUrl.replace('!emote ', '')
                let imgSrc = emoteUrl.match(/src="([^"]+)"/)?.[1];
                
                if(Utils.emptyString(imgSrc)) {
                    imgSrc = emoteUrl
                }
                if (imgSrc) {
                    worldmapUser.pinEmote = imgSrc;
                    await worldmapUser.save();

                    SocketIO.getInstance().emitEvent(`map:${_channel.user.username}`, 'user-updated', {
                        type: 'message',
                        username: _user.username,
                    });
                }

                _bot.sendMessage(_channel.user.username, `@${_user.displayName}, tu pin personalizado ha sido guardado ;)`);
            }
        }

        
       
    }
);

export default MapEmoteCommand;