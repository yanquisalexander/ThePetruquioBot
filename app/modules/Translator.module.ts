import { translate } from '@vitalets/google-translate-api';

const LANGUAGE_LIST = [
    'en',
    'pt',
    'cn',
    'de',
    'es',
    'fi',
    'fr',
    'jp',
    'kr',
    'pl',
    'ru',
    'ro',
    'tu',
    'it',
];

class TranslatorModule {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    private static async translate(text: string, target: string): Promise<string> {
        const result = await translate(text, { to: target });
        return result.text;
    }

    public static get languageList(): string[] {
        return LANGUAGE_LIST;
    }

    public static async generateMessage(target: string, message: string, username: string): Promise<string> {
        console.log(target)
        let say = 'say';
        let messageText = message;

        switch (target) {
            case 'es':
                say = 'dice';
                break;
            case 'fr':
                say = 'dit';
                break;
            case 'it':
                say = 'dice';
                break;
            case 'pt':
                say = 'diz';
                break;
            case 'de':
                say = 'sagt';
                break;
            default:
                say = 'say';
                break;

        }

        let lazy = false;

        if(message.length > 250) {
            lazy = true;
            messageText = "i'm too lazy to translate long messages ^^"
        }

        if(lazy) {
            return `@${username}, ${messageText}`;
        } else {
            try {
                const translatedMessage = await this.translate(message, target);
                return `@${username} ${say}: ${translatedMessage}`;
            } catch (error) {
                console.error(error);
                return `Sorry, @${username}, I couldn't translate that.`
            }
        }

    }
}

export default TranslatorModule;