import { Command, CommandPermission } from "../models/Command.model";
import { SystemCommands } from "./add.command";


const DeleteCommand = new Command(
    'delcom',
    '*',
    [CommandPermission.MODERATOR, CommandPermission.BROADCASTER],
    'Elimina un comando del bot.',
    {},
    '', // System commands don't need a response
    async (user, args, channel) => {
        const commandName = args[0];

        if (!commandName) {
            return `@${user.username}, debes especificar el nombre del comando.`
        }

        if (SystemCommands.includes(commandName)) {
            return `@${user.username}, command ${commandName} is a system command and cannot be removed.`;
        }

        const command = await Command.find(channel, commandName);

        if (!command) {
            return `@${user.username}, el comando !${commandName} no existe.`;
        }

        try {
            await command.delete(channel);

            return `@${user.username}, el comando !${commandName} fue eliminado correctamente.`;
        } catch (error) {
            console.error(error);
            return `@${user.username}, ha ocurrido un error al eliminar el comando.`;
        }

    }
);

export default DeleteCommand;