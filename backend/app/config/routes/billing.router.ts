import { Router } from 'express'
import { BillingsController } from '../../controllers/Billings.controller'
import chalk from 'chalk'

export const createBillingRouter = (): Router => {
  const router = Router()
  const billingsController = new BillingsController()

  router.post('/create-checkout-session', billingsController.createCheckoutSession)

  console.log(chalk.bgGreenBright('[ROUTER]'), 'Billing router created')
  return router
}
