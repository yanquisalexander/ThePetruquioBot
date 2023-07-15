import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from "./routes/index.js";
import passport from '../lib/passport.js'
import status from 'express-status-monitor' 
const PORT = process.env.PORT || 3000;

export const WebServer = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



WebServer.use(cors('*'))
WebServer.use(passport.initialize())
WebServer.use('/', bodyParser.json(), async (req, res, next) => {
  try {
    const twitchRouter = await import('./routes/twitch.js');
    twitchRouter.default(req, res, next);
  } catch (error) {
    console.error('Error al importar el módulo de rutas de Twitch:', error);
    next(error);
  }
});



WebServer.use(status())

WebServer.use('/api/', routes)

WebServer.get('*', (req, res) => {
  res.status(404).json({
    errors: [
      "Apparently the requested URL or Resource could not be found 😿."
    ],
    error_type: "not_found"
  })
})





WebServer.use((err, req, res, next) => {
  res.status(500).json({ error: err });
});


WebServer.boot = async () => {
  WebServer.listen(PORT, async () => {
    console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
  })
}

