import 'dotenv/config'
import express, { type Express } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import router from '../config/routes'
import TwitchEvents from './TwitchEvents.module'
import Passport from '../../lib/Passport'
import http from 'http'
import SocketIO from './SocketIO.module'
import multer from 'multer'

class WebServer {
  constructor() {
    throw new Error('This class cannot be instantiated')
  }

  public static app: Express
  public static port: number = 3000
  public static isRunning: boolean = false
  public static ioServer: http.Server

  public static async setup(): Promise<void> {
    const app = express()
    this.port = Number(process.env.PORT) || 3000

    /* Setup middlewares */

    app.use(cors({
      origin: '*'
    }))
    app.use('/v2/', bodyParser.json(), bodyParser.urlencoded({ extended: true }), multer().any(), router)
    app.get('/v1/*', (req, res) => {
      res.status(410).json({
        error_type: 'deprecated',
        errors: [
          'PetruquioBot API v1 is deprecated and was removed. Please use v2 instead.'
        ],
        more_info: 'https://www.petruquio.live'
      })
    })
    app.use(Passport.getPassport().initialize())

    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({
        error: err.message
      })
    })

    app.get('*', (req, res) => {
      res.status(404).json({
        errors: [
          'Apparently the requested URL or Resource could not be found 😿.'
        ],
        error_type: 'not_found'
      })
    })

    app.post('/v2/*', (req, res) => {
      res.status(404).json({
        errors: [
          'Apparently the requested URL or Resource could not be found 😿.'
        ],
        error_type: 'not_found'
      })
    })

    this.app = app
    console.log('[WEB SERVER] Finished setting up web server.')
  }

  public static async boot(): Promise<void> {
    await this.setup()
    TwitchEvents.middleware.apply(this.app)
    const ioServer = http.createServer(this.app)

    const socket = SocketIO.initialize(ioServer)

    this.ioServer = ioServer

    this.ioServer.listen(this.port, async (): Promise<void> => {
      console.log(`[WEB SERVER] Petruquio.LIVE WebServer ready on port ${this.port} ✅`)
      this.isRunning = true
      await TwitchEvents.markAsReady()
      await TwitchEvents.subscribeAllChannels()
    })
  }
}

export default WebServer
