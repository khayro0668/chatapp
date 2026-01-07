const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { setupWebsocket } = require('./controllers/websocketController');

const PORT = process.env.PORT || 3000;
const viewDir = path.join(__dirname, 'views');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const serveStatic = (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/client.js') {
    const clientPath = path.join(__dirname, 'models', 'client.js');
    fs.readFile(clientPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', 'text/javascript');
      res.writeHead(200);
      res.end(data);
    });
    return;
  }

  const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  const fullPath = path.normalize(path.join(viewDir, relativePath));


  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.writeHead(200);
    res.end(data);
  });
};

const server = http.createServer(serveStatic);
const wss = new WebSocket.Server({ server });
setupWebsocket(wss);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
