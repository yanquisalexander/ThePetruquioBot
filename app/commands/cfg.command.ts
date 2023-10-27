import { Command, CommandPermission } from "../models/Command.model";



const ConfigCommand = new Command(
    'cfg',
    '*',
    [CommandPermission.MODERATOR],
    'Edita la configuración del bot.',
    {},
    '', // System commands don't need a response
    async (user, args, channel) => {
        const settingName = args[0];
        const settingValue = args.slice(1).join(' ');

        if (!settingName || !settingValue) {
            if (settingName === 'show') {
                return `@${user.username}, ajustes disponibles: ` + Object.keys(channel.preferences).join(', ');
            }
            return `@${user.username}, debes especificar el nombre y el valor de la configuración.`;
        }


        if (!(settingName in channel.preferences)) {
            return `@${user.username}, la configuración ${settingName} no existe.`;
        }


        try {
            // Value respects the type of the setting? (Boolean, Typescript)
           




            await channel.updatePreferences({ [settingName]: settingValue });

            return `@${user.username}, la configuración ${settingName} fue actualizada correctamente.`;
        } catch (error) {
            console.error(error);
            return `@${user.username}, ha ocurrido un error al actualizar la configuración.`;
        }
    })


export default ConfigCommand;