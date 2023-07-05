import express from "express";
import bodyParser from "body-parser";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const PORT = process.env.PORT || 3000;

export const WebServer = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

WebServer.use(bodyParser.json());
WebServer.use(express.static(join(__dirname, '../', 'client', '.nuxt')));

WebServer.get('*', (req, res) => {
    try {
        res.sendFile(join(__dirname, '../', 'client', '.nuxt', 'index.html'));
    } catch (error) {
        res.json({ error: error.message });
    }
});

WebServer.use((err, req, res, next) => {
    res.status(500).json({ error: err });
});


WebServer.boot = async () => {
    WebServer.listen(PORT, () => {
        console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
    })
}

