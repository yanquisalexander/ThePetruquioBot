/* This isn't really a module, but i like to keep the code organized */

import { type Bot } from '../../bot'
import { type ChatUserstate } from 'tmi.js'
import type Channel from '../models/Channel.model'

const RANDOM_MESSAGES = [
  'I\'m not a human, I\'m a bot.',
  'Beep boop, I\'m a bot.',
  'Greetings, human ;)',
  'i don\'t have nothing to say PopNemo'
]

const RANDOM_WHY_RESPONSES = [
  'I really don\'t know.',
  'Why not?',
  'Because yes.',
  'Because I said so.',
  'Because I\'m a bot.',
  'Because I\'m a bot, not a human.'
]

class RandomResponses {
  constructor () {
    throw new Error('This class cannot be instantiated')
  }

  static processRandomResponse (message: string, user: ChatUserstate, channel: Channel, bot: Bot): string {
    // Presunto comando
    if (message.startsWith('!')) {
      if (message.startsWith('!ban')) {
        return `@${user.username}, are you trying to ban me?`
      }
    }

    // Presunta pregunta
    if (message.endsWith('?')) {
      if (message.includes('why')) {
        return `@${user.username}, ${RANDOM_WHY_RESPONSES[Math.floor(Math.random() * RANDOM_WHY_RESPONSES.length)]}`
      }
    }

    // Presunta mención

    return `@${user.username}, ${RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)]}`
  }
}

export default RandomResponses
