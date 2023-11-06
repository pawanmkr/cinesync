import WebTorrent from "webtorrent";
import path from 'path'
import fs from 'fs'

export async function getMetadata(req, res) {
  const { magnetUri } = req.body;
  const client = new WebTorrent();

  const files = []

  client.add(magnetUri, (torrent) => {
    torrent.files.forEach(file => {
      if (file.type.includes('video') || file.type.includes("octet-stream")) {
        files.push({
          "name": file.name,
          "path": file.path,
          "size": Math.round(file.size / 1000000)
        })
      }
    });
    res.send(files)
  })
}

export async function streamFile(req, res) {
  console.log("Entered: function streamFile()")
  let { filePath, magnetUri } = req.query;

  const client = new WebTorrent();
  let totalProgress = 0;
  let canWrite = true;

  client.add(magnetUri, (torrent) => {
    const file = torrent.files.find(file => {
      console.log("Finding file...")
      return file.path === filePath;
    })

    console.log(file.length)

    if (!file) {
      return res.status(404).send(`File not found in the torrent.`);
    }

    res.setHeader("Content-Type", "application/octet-stream")
    res.setHeader("Content-Length", file.length)
    res.setHeader("Content-disposition", "attachment; filename=" + path.basename(file.name))

    const totoalFileSize = file.size

    const stream = file.createReadStream({
      highWaterMark: 16 * 1024,
    });
    let uploadBytes = 0

    stream.on('open', () => {
      console.log("opened")
    })

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

    client.on('error', (error) => {
      console.error('Client error:', error);
      stream.destroy();
      res.end();
    });

    stream.on('data', (chunk) => {
      uploadBytes += chunk.length
      let currentProgress = Math.round((uploadBytes / totoalFileSize) * 100);
      const mb = Math.round(uploadBytes / 1000000);
      if (currentProgress !== totalProgress) {
        console.log(currentProgress + "%  --->  " + mb + "MB")
      }
      totalProgress = currentProgress;

      if (!res.write(chunk)) {
        canWrite = false;
        stream.pause();
      }
    })

    stream.on('end', () => {
      res.end()
      client.destroy(function (err) {
        if (err) console.log(err)
      })
    })
  })
}
