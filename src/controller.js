import WebTorrent from "webtorrent";
import path from 'path'

export async function getMetadata(req, res) {
  const {magnetUri} = req.body;
  const client = new WebTorrent();

  const files = []

  client.add(magnetUri, (torrent) => {
    torrent.files.forEach(file => {
      files.push({
        "name": file.name,
        "size": file.size
      })
    });
    res.send(files)
  })
}

export async function streamFile(req, res) {
  let {index, magnetUri} = req.query;
  index = parseInt(index)

  const client = new WebTorrent();
  let totalProgress = 0;
  let rounds = 0;

  client.add(magnetUri, (torrent) => {
    if (index > torrent.files.length - 1) {
      return res.status(404).send(`This torrent has only ${torrent.files.length} files`)
    }

    const file = torrent.files[index]
    if (!file) {
      return res.status(404).send(`File not found in the torrent.`);
    }

    res.setHeader("Content-Type", "application/octet-stream")
    res.setHeader("Content-Length", file.size)
    res.setHeader("Content-disposition", "attachment; filename=" + path.basename(file.name))

    const totoalFileSize = file.size

    const stream = file.createReadStream();
    let uploadBytes = 0

    stream.on('error', (error) => {
      stream.destroy()
      res.status(500).send(error)
    })

    stream.on('data', (chunk) => {
      uploadBytes += chunk.length
      let currentProgress = Math.round((uploadBytes / totoalFileSize) * 100);
      const mb = Math.round(uploadBytes / 1000000);
      if (currentProgress !== totalProgress) {
        console.log(currentProgress + "%  --->  " + mb + "MB")
      }
      totalProgress = currentProgress;
      res.write(chunk)
    })

    stream.on('end', () => {
      res.end()
      client.destroy(function (err) {
        console.log(err)
      })
    })
  })
}