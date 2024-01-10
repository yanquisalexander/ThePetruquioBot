import { Command, CommandPermission } from "../models/Command.model";

export const SystemCommands = [
    'addcom',
    'delcom',
    'random',
    'map',
    'from',
    'show',
    'mask',
    'so',
    'user-update',
    'emote',
    'msg',
    'random',
    'cfg',
    'join',
];


const AddCommand = new Command(
    'addcom',
    '*',
    [CommandPermission.MODERATOR, CommandPermission.BROADCASTER],
    'Añade un comando al bot.',
    {},
    '', // System commands don't need a response
    async (user, args, channel) => {
        const commandName = args[0].toLowerCase().replace('!', '');
        const commandResponse = args.slice(1).join(' ');

        if (!commandName || !commandResponse) {
            return `@${user.username}, debes especificar el nombre y la respuesta del comando.`
        }

        if (SystemCommands.includes(commandName)) {
            return `@${user.username}, command ${commandName} is a system command and cannot be overwritten.`;
        }

        const command = new Command(
            commandName,
            channel.user.username,
            [CommandPermission.MODERATOR, CommandPermission.BROADCASTER],
            '',
            {
                globalCooldown: 5,
            },
            commandResponse,
            undefined,
            undefined,
            true
        );

        console.log(command);

        try {
            await command.save(channel);

            return `@${user.username}, el comando !${commandName} fue registrado correctamente.`;
        } catch (error) {
            console.error(error);
            return `@${user.username}, ha ocurrido un error al registrar el comando.`;
        }

    }
);

export default AddCommand;