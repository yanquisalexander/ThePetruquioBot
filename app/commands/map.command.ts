import { Command, CommandPermission } from "../models/Command.model";

const getDefaultMessage = () => {
    const defaultMapMessages = [
        'You can access our EarthDay map here: #map_url',
        'Check out our EarthDay map here: #map_url',
        'Our EarthDay map is available here: #map_url',
        'Meet our EarthDay Community Map here: #map_url',
    ]

    const message = defaultMapMessages[Math.floor(Math.random() * defaultMapMessages.length)];

    return message;
}



const MapCommand = new Command(
    'map',
    '*',
    [CommandPermission.VIEWER],
    'Devuelve el link al mapa de la comunidad en el canal especificado.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        if(!_channel || !_channel.preferences) return;
        if(!_channel.preferences.enableCommunityMap?.value) return;
        if (_channel?.preferences?.mapCommandMessage?.value && _channel.preferences.mapCommandMessage.value.length > 0) {
            _bot.sendMessage(_channel.user.username, `${_channel.preferences.mapCommandMessage.value?.replace('#map_url', `petruquio.live/c/${_channel.user.username}/map`)}`);
            return '';
        } else {
            _bot.sendMessage(_channel.user.username, `${getDefaultMessage().replace('#map_url', `petruquio.live/c/${_channel.user.username}/map`)}`);
            return '';
        }
    }
);

export default MapCommand;