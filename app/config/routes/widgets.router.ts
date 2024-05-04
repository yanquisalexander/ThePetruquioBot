import { Router } from 'express'
import chalk from 'chalk'
import WidgetsController from '@/app/controllers/Widgets.controller'

export const createWidgetsRouter = (): Router => {
  const router = Router()
  const widgetsController = new WidgetsController()
  /**
   *
   *  This router:
   * - Facilitates the communication between the frontend and the Twitch API
   */

  router.get('/core', widgetsController.getCoreWidgets)
  router.post('/core', widgetsController.createCoreWidget)

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Widgets router created')
  return router
}
