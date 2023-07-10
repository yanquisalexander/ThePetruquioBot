import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from "./routes/index.js";
import passport from '../lib/passport.js'
const PORT = process.env.PORT || 3000;

export const WebServer = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



WebServer.use(cors('*'))
WebServer.use(passport.initialize())
WebServer.use(bodyParser.json());
WebServer.use('/', async (req, res, next) => {
  try {
    const twitchRouter = await import('./routes/twitch.js');
    twitchRouter.default(req, res, next);
  } catch (error) {
    console.error('Error al importar el módulo de rutas de Twitch:', error);
    next(error);
  }
});

import('express-status-monitor')
  .then(statusMonitor => {
    WebServer.use(statusMonitor.default());
  })

WebServer.use('/', routes)







WebServer.use((err, req, res, next) => {
  res.status(500).json({ error: err });
});


WebServer.boot = async () => {
  WebServer.listen(PORT, async () => {
    console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
  })
}

