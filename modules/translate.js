import gtrans from 'node-gtrans';
import { badWordsList } from '../app/constants/bad-words-list.js';

export const langExpl = [
  'Unlock the magic of translation with commands like !en (English) or !pt (Portuguese).',
  'Expand your linguistic horizons with commands like !cn, !de, or !es.',
  'Master the art of multilingual communication with commands like !fi, !fr, or !jp.',
  'Speak in the languages of the world with commands like !kr, !pl, or !ru.',
  'Discover new cultures through language with commands like !ro, !tu, or !it.',
  'Elevate your conversations with commands like !es or !fr.',
];

export const langList = [
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

export const translate = async (message, command, username, settings) => {
  const targetLang = command;
  let messageText = message.substring(command.length + 2); // Remove the command and space

  let friendlyMode = false;
  if (settings && settings.friendly_mode) {
    friendlyMode = settings.friendly_mode;
  }

  let say = 'say';

  // Modificar el valor de `say` según el idioma destino
  switch (targetLang) {
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

  // Lazy mode
  let lazy = false;
  if (messageText.length > 2) {
    if (messageText.length > 250) {
      lazy = true;
      messageText = "I'm too lazy to translate long sentences ^^";
    }

    if (lazy ) {
      return `@${username}, ${messageText}`;
    }

    if (!lazy) {
      try {
        const translatedText = await gtrans(messageText, { to: targetLang });
        if(friendlyMode) {
          // Filter offensive language or inappropriate content in friendly mode
          const filteredText = filterTranslation(translatedText.data.translated);
          return `${username} ${say}: ${filteredText}`;
        }

        return `${username} ${say}: ${translatedText.data.translated}`;
        
      } catch (err) {
        console.error('Translation Error:', err);
        return `Sorry, @${username}, I couldn't translate that.`;
      }
    }
  }
};

const filterTranslation = (text) => {
  // Filter offensive language or inappropriate content
  if (badWordsList.some(badWord => text.includes(badWord))) {
    return "I think that would be offensive if I said that ^^";
  }

  // Limit translated message length
  if (text.length > 200) {
    return text.substring(0, 200) + '...';
  }

  return text;
};
