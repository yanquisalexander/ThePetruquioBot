import { betterStack, createBetterStack } from '@/app/services/BetterStack'
import MemoryVariables from './MemoryVariables'

class MonkeyPatches {
  constructor () {
    throw new Error('This class cannot be instantiated')
  }

  public static apply (): void {
    createBetterStack()
    this.patchConsole()
    console.log('[MONKEY PATCHES] Monkey patches applied.')
  }

  private static patchConsole (): void {
    /* Monkey patching console.log, console.info, console.warn, console.error, and console.debug to add timestamps */
    console.log('[MONKEY PATCHES] Patching console methods...')
    const patchConsoleMethod = (originalMethod: (...args: any[]) => void, logLevel: string) => {
      return (...args: any[]) => {
        const date = new Date()
        const timestamp = `[${date.toLocaleString()}]`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        originalMethod(timestamp, ...args)
        const log = args.join(' ')
        MemoryVariables.getLogs().push(`${timestamp} ${log}`)
        betterStack.logtail.log(`${timestamp} [${logLevel}] ${log}`).catch((error) => {
          console.error('Error logging to logtail:', error)
        })

        if (logLevel === 'ERROR') {
          betterStack.logtail.error(log).catch((error) => {
            console.error('Error logging error to BetterStack:', error)
          })
        } else if (logLevel === 'INFO') {
          betterStack.logtail.info(log).catch((error) => {
            console.error('Error logging info to BetterStack:', error)
          })
        }
      }
    }

    console.log = patchConsoleMethod(console.log, 'INFO')
    console.info = patchConsoleMethod(console.info, 'INFO')
    console.warn = patchConsoleMethod(console.warn, 'WARN')
    console.error = patchConsoleMethod(console.error, 'ERROR')
    console.debug = patchConsoleMethod(console.debug, 'DEBUG')

    console.log('[MONKEY PATCHES] Patched console methods.')
  }
}

export default MonkeyPatches
