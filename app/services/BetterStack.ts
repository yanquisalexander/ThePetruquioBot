import { Logtail } from '@logtail/node'
import chalk from 'chalk'
import 'dotenv/config'

// Singleton BetterStack

class BetterStack {
  private static instance: BetterStack
  public readonly logtail: Logtail

  private constructor () {
    this.logtail = new Logtail('bfjucJmvxj13GaaNdMNqj4G3')
  }

  static getInstance (): BetterStack {
    if (!BetterStack.instance) {
      BetterStack.instance = new BetterStack()
    }

    return BetterStack.instance
  }
}
export const createBetterStack = (): void => {
  console.log(chalk.yellowBright('[BetterStack]'), 'Creating BetterStack instance')
  BetterStack.getInstance()
}

export const betterStack = BetterStack.getInstance()
