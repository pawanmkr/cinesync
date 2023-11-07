import path from 'path'
import { client } from './server.js';

export async function getMetadata(req, res) {
  const { magnetUri } = req.body;
  const files = []

  try {
    client.add(magnetUri, (torrent) => {
      console.log("\n> Adding torrent...\n")
      torrent.files.forEach(file => {
        if (file.type.includes('video') || file.type.includes("octet-stream")) {
          files.push({
            "name": file.name,
            "path": file.path,
            "size": Math.round(file.size / 1000000)
          })
        }
      })
      client.destroy()

      res.send(files)
    })
  } catch (error) {
    console.log(error)
  }
}

export async function handleStreaming(req, res) {
  let { filePath, magnetUri } = req.query;

  console.log("\n> Adding torrent...")
  client.add(magnetUri, (torrent) => {
    console.log("\n> Torrent is ready to serve")

    let totalProgress = 0;
    let canWrite = true;

    console.log("\n> Finding your file...")
    const file = torrent.files.find(file => {
      return file.path === filePath;
    })

    file.select();

    console.log('\n> ' + Math.round(file.length / 1000000) + ' MB')

    if (!file) {
      return res.status(404).send(`\n> File not found in the torrent.`);
    }

    res.setHeader("Content-Type", "application/octet-stream")
    res.setHeader("Content-Length", file.length)
    res.setHeader("Content-disposition", "attachment; filename=" + path.basename(file.name))

    const totoalFileSize = file.size

    const stream = file.createReadStream({
      highWaterMark: 2048 * 1024,
    });
    let uploadBytes = 0

    res.on('drain', () => {
      canWrite = true;
      stream.resume();
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
      client.destroy(function (err) {
        if (err) console.error('Client destroy error:', err);
      });
    });

    res.on('error', (error) => {
      console.error('Response error:', error);
      stream.destroy();
      client.destroy(function (err) {
        if (err) console.error('Client destroy error:', err);
      });
    });

    stream.on('data', (chunk) => {
      uploadBytes += chunk.length
      let currentProgress = Math.round((uploadBytes / totoalFileSize) * 100);
      const mb = Math.round(uploadBytes / 1000000);
      if (currentProgress !== totalProgress) {
        console.log('> ' + currentProgress + "%  --->  " + mb + "MB")
      }
      totalProgress = currentProgress;

      if (!res.write(chunk)) {
        canWrite = false;
        stream.pause();
      }
    })

    stream.on('end', () => {
      console.log("\n> Stream ended")
      res.end()
      client.destroy(function (err) {
        if (err) console.log(err)
      })
    })

    res.on('close', () => {
      console.log("\n> Response ended")
      client.remove(magnetUri, {
        destroyStore: true
      })
    })

    client.on('error', (error) => {
      console.error('Client error:', error);
      client.destroy();
      res.end();
    });
  })
}