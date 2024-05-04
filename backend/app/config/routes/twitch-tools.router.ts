import { Router } from 'express'
import chalk from 'chalk'
import { TwitchToolsController } from '@/app/controllers/TwitchTools.controller'

export const createTwitchToolsRouter = (): Router => {
  const router = Router()
  const twitchToolsController = new TwitchToolsController()
  /**
   *
   *  This router:
   * - Facilitates the communication between the frontend and the Twitch API
   */

  router.get('/users/search', twitchToolsController.searchUsers)

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Twitch Tools router created')
  return router
}
