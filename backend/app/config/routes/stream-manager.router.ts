import { Router } from 'express'
import { StreamManagerController } from '@/app/controllers/StreamManager.controller'
import chalk from 'chalk'

export const createStreamManagerRouter = (): Router => {
  const router = Router()
  const streamManagerController = new StreamManagerController()

  router.get('/', streamManagerController.index)
  router.get('/stream', streamManagerController.getStream)
  router.post('/clip', streamManagerController.createClip)
  router.post('/smart-assistant', streamManagerController.talkToSmartAssistant)

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Stream Manager router created')
  return router
}
