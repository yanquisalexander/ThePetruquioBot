import { LemonsqueezyClient } from 'lemonsqueezy.ts'
import { Configuration } from '../config'

export const lemonSqueezy = new LemonsqueezyClient(Configuration.LEMON_API_KEY)
