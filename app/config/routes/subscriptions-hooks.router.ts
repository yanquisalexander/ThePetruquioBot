import { Router } from 'express'
import chalk from 'chalk'

export const createSubscriptionsHooksRouter = (): Router => {
  const router = Router()

  /**
   *
   *  This router:
   * - Receives data from LemonSqueezy and updates the user's subscription via Webhooks
   */

  router.post('/lemon-squeezy', (req, res) => {
    console.log(chalk.bgGreenBright('[ROUTER]'), 'Received LemonSqueezy data:', req.body)
    res.status(200).send('OK')
  })

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Subscriptions Hooks router created')
  return router
}
