import { Command, CommandPermission } from "../models/Command.model";
import SpectatorLocation from "../models/SpectatorLocation.model";
import User from "../models/User.model";
import Geolocation from "../modules/Geolocation.module";
import SocketIO from "../modules/SocketIO.module";


const FromCommand = new Command(
    'from',
    '*',
    [CommandPermission.VIEWER],
    'Actualiza tu ubicación en el Community Map.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const user = await User.findByTwitchId(_user.id);

        if (!user) {
            return;
        } else {

            if (_args.length === 0) {
                return _bot.sendMessage(_channel, `@${_user.displayName}, para actualizar tu ubicación en el mapa, debes escribir !from <ciudad, país> ;)`);
            }
            let userLocation = await SpectatorLocation.findByUserId(user.twitchId);
            if (!userLocation) {
                let geoData = await Geolocation.getLocalization(_args.join(' '));
                if (!geoData) {
                    _bot.sendMessage(_channel, `@${_user.displayName}, hubo un problema al obtener tu ubicación BibleThump`);
                    return '';
                }
                let location = new SpectatorLocation(user.twitchId, geoData.latitude?.toString(), geoData.longitude?.toString(), geoData?.formattedAddress, geoData?.countryCode);
                await location.save();

                SocketIO.getInstance().emitEvent(`map:${_channel.user.username}`, 'user-updated', {
                    type: 'location',
                    username: _user.username,
                    latitude: geoData.latitude?.toString(),
                    longitude: geoData.longitude?.toString(),
                });

                _bot.sendMessage(_channel, `@${_user.displayName}, tu ubicación fue actualizada correctamente ;)`);
                return;
            } else {
                let geoData = await Geolocation.getLocalization(_args.join(' '));
                if (!geoData) {
                    _bot.sendMessage(_channel, `@${_user.displayName}, hubo un problema al obtener tu ubicación BibleThump`);
                    return;
                }
                userLocation.latitude = geoData.latitude?.toString();
                userLocation.longitude = geoData.longitude?.toString();
                userLocation.location = geoData?.formattedAddress;
                userLocation.countryCode = geoData?.countryCode;

                SocketIO.getInstance().emitEvent(`map:${_channel.user.username}`, 'user-updated', {
                    type: 'location',
                    username: _user.username,
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                });
                await userLocation.save();
                _bot.sendMessage(_channel, `@${_user.displayName}, tu ubicación fue actualizada correctamente ;)`);
                return;
            }

        }
    }
);

export default FromCommand;