import express, { urlencoded } from "express";
import dotenv from 'dotenv';
import morgan from "morgan";
import statusMonitor from 'express-status-monitor'
import router from "./route.js";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use(statusMonitor())

app.setMaxListeners(100);

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening @ http://localhost:${PORT}`);
});
