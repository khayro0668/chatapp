const fs = require('fs');
const path = require('path');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const sendFile = (res, fullPath) => {
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

const isInside = (fullPath, baseDir) => fullPath.startsWith(baseDir);

const createStaticHandler = (viewDir) => (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/client.js') {
    const clientPath = path.normalize(path.join(__dirname, '..', 'models', 'client.js'));
    sendFile(res, clientPath);
    return;
  }

  const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  const fullPath = path.normalize(path.join(viewDir, relativePath));

  if (!isInside(fullPath, viewDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  sendFile(res, fullPath);
};

module.exports = {
  createStaticHandler,
};
