import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from "./routes/index.js";

const PORT = process.env.PORT || 3000;

export const WebServer = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

WebServer.use(bodyParser.json());
WebServer.use(cors('*'))

WebServer.use('/', routes)




WebServer.use((err, req, res, next) => {
    res.status(500).json({ error: err });
});


WebServer.boot = async () => {
    WebServer.listen(PORT, () => {
        console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
    })
}

