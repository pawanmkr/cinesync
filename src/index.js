import express from "express";
import dotenv from 'dotenv';
import morgan from "morgan";
import statusMonitor from 'express-status-monitor'
import router from "./route.js";
import cors from 'cors'
import bodyParser from 'body-parser'

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

app.use(statusMonitor())

app.setMaxListeners(100);

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening @ http://localhost:${PORT}`);
});
