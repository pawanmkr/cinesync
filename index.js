import express, { urlencoded } from "express";
import WebTorrent from "webtorrent";
import dotenv from 'dotenv';
import morgan from "morgan";
import path from "path";
import statusMonitor from 'express-status-monitor'

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use(statusMonitor())

app.setMaxListeners(100);

app.get('/', async (req, res) => {
  try {
    const magnetUri = process.env.MAGNET;
    const client = new WebTorrent();

    client.add(magnetUri, (torrent) => {

      const file = torrent.files[0]
        const filePath = file.path;

        res.setHeader('Content-disposition', 'attachment; filename=' + path.basename(filePath));
        res.setHeader('Content-type', 'application/octet-stream');

        const fileStream = file.createReadStream();

        fileStream.on('error', (error) => {
          console.error('Error streaming file:', error);
          res.status(500).end();
        });
        
        fileStream.on('end', () => {
          res.end();
        });
        
        fileStream.on('data', (chunk) => {
          console.log(chunk)
          res.write(chunk)
        })

        fileStream.on('end', () => {
          res.end()
        })

        res.on('close', () => {
          fileStream.destroy()
        })
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening @ http://localhost:${PORT}`);
});
