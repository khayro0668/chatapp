const http = require('http');
const path = require('path');
const { createStaticHandler } = require('./controllers/staticController');
const { handleUpgrade } = require('./controllers/websocketController');

const PORT = process.env.PORT || 3000;
const viewDir = path.join(__dirname, 'views');

const server = http.createServer(createStaticHandler(viewDir));

server.on('upgrade', handleUpgrade);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
