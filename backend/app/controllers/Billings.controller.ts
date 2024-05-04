import { paypalService } from '@/app/services/PayPal'
import { type Request, type Response } from 'express'
import { type ExpressUser } from '@/app/interfaces/ExpressUser.interface'
import CurrentUser from '@/lib/CurrentUser'
import { Configuration } from '@/app/config'

export class BillingsController {
  async createCheckoutSession (req: Request, res: Response): Promise<Response> {
    const currentUser = new CurrentUser(req.user as ExpressUser)

    const user = await currentUser.getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!user.email) {
      return res.status(400).json({ error: 'User does not have an email' })
    }

    try {
      const checkout = await paypalService.createSubscription(user)

      return res.json(checkout)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error creating checkout' })
    }
  }
}
