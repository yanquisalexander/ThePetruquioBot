import { Router } from 'express'
import { DashboardController } from '../../controllers/Dashboard.controller'
import chalk from 'chalk'

export const createDashboardRouter = (): Router => {
  const router = Router()
  const dashboardController = new DashboardController()

  router.get('/', dashboardController.index)
  router.post('/join', dashboardController.join)
  router.post('/part', dashboardController.part)
  router.post('/toggle-mute', dashboardController.toggleMute)
  router.post('/send-message', dashboardController.sendMessageAsBot)
  router.get('/moderated-channels', dashboardController.getModeratedChannels)
  router.get('/notifications', dashboardController.getNotifications)
  router.put('/notifications/:id/mark-as-read', dashboardController.markNotificationAsRead)

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Dashboard router created')
  return router
}
