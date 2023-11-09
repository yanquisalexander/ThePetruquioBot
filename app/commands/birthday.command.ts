import { Command, CommandPermission } from "../models/Command.model";
import User from "../models/User.model";


const BirthdayCommand = new Command(
    'bday',
    '*',
    [CommandPermission.VIEWER],
    'Actualiza tu fecha de cumpleaños.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const user = await User.findByTwitchId(_user.id);

        if (!user) {
            return;
        } else {
            
            if (_args.length === 0 || _args[0].toLowerCase() === "show") {
                const userBirthday = user.birthday;
                if (userBirthday) {
                    const day = userBirthday.getDate();
                    const month = userBirthday.toLocaleString('es-ES', { month: 'long' });
                    _bot.sendMessage(_channel, `@${_user.displayName}, me has dicho que tu cumpleaños es el ${day} de ${month}.`);
                } else {
                    _bot.sendMessage(_channel, `@${_user.displayName}, aún no has especificado tu fecha de cumpleaños.`);
                }
                return;
            }

            if(_args[0].toLowerCase() === "delete") {
                user.birthday = null;
                try {
                    await user.save();
                } catch (error) {
                    console.error(error);
                    _bot.sendMessage(_channel, `@${_user.displayName}, ha ocurrido un error al eliminar tu fecha de cumpleaños.`);
                    return;
                }
                _bot.sendMessage(_channel, `@${_user.displayName}, tu fecha de cumpleaños fue eliminada correctamente.`);
                return;
            }

            if(_args.length < 1) {
                _bot.sendMessage(_channel, `@${_user.displayName}, debes especificar tu fecha de cumpleaños.`);
                return;
            }

            let date = _args[0].split('-');

            if(date.length < 2) {
                date = _args[0].split('/');
            }

            if(date.length < 2) {
                _bot.sendMessage(_channel, `@${_user.displayName}, debes especificar tu fecha de cumpleaños.`);
                return;
            }

            const day = parseInt(date[0]);
            const month = parseInt(date[1]);

            if(isNaN(day) || isNaN(month)) {
                _bot.sendMessage(_channel, `@${_user.displayName}, debes especificar tu fecha de cumpleaños.`);
                return;
            }

            if(day < 1 || day > 31 || month < 1 || month > 12) {
                _bot.sendMessage(_channel, `@${_user.displayName}, parece que tu fecha de cumpleaños no es válida.`);
                return;
            }

            user.birthday = new Date(1970, month - 1, day);

            console.log(user.birthday);

            try {
                await user.save();
            } catch (error) {
                console.error(error);
                _bot.sendMessage(_channel, `@${_user.displayName}, ha ocurrido un error al actualizar tu fecha de cumpleaños.`);
                return;
            }

            _bot.sendMessage(_channel, `@${_user.displayName}, tu fecha de cumpleaños fue actualizada correctamente a ${user.birthday.getDate()} de ${user.birthday.toLocaleString('es-ES', { month: 'long' })}.`);

        }
    }
);

export default BirthdayCommand;