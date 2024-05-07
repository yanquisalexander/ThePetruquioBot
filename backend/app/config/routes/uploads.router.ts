import { Router } from 'express'
import chalk from 'chalk'
import { UploadsController } from '@/app/controllers/Uploads.controller'

export const createUploadsRouter = (): Router => {
    const router = Router()
    const uploadsController = new UploadsController()

    router.get('/', uploadsController.getUploads)
    router.post('/', uploadsController.uploadFile)

    console.log(chalk.bgGreenBright('[ROUTER]'), 'Uploads router created')
    return router
}
