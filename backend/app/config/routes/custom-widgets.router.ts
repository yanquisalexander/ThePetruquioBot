import { Router } from 'express'
import { CustomWidgetsController } from "@/app/controllers/CustomWidgets.controller"
import chalk from 'chalk'

export const createCustomWidgetRouter = (): Router => {
    const router = Router()
    const customWidgetController = new CustomWidgetsController()

    router.get('/', customWidgetController.getWidgets)
    router.post('/', customWidgetController.updateWidget)
    router.get('/:id', customWidgetController.getWidget)
    router.put('/:id', customWidgetController.updateWidget)

    console.log(chalk.bgGreenBright('[ROUTER]'), 'Custom Widget router created')
    return router
}
