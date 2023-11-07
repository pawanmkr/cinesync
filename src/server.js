import cluster from 'cluster';
import os from 'os';
import app from './app.js';
import WebTorrent from "webtorrent";

const numCPUs = os.cpus().length;

let client = null

/* if (cluster.isPrimary) {
  console.log(`\n> Total CPU Cores: ${numCPUs}`)
  console.log(`\n> Master ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`\n> Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  client = new WebTorrent({ destroyStoreOnDestroy: true });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n> Worker ${process.pid} started and listening on http://localhost:${PORT}`);
  });
} */

client = new WebTorrent({ destroyStoreOnDestroy: true });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n> Worker ${process.pid} started and listening on http://localhost:${PORT}`);
});

export { client }