const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const clients = new Map(); // socket -> name

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const serveFile = (req, res) => {
  const urlPath = req.url.split('?')[0];
  const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  const fullPath = path.normalize(path.join(publicDir, relativePath));

  if (!fullPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

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

const createAcceptValue = (key) =>
  crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');

const encodeFrame = (str, opcode = 0x1) => {
  const payload = Buffer.from(str);
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    const high = Math.floor(len / 2 ** 32);
    const low = len >>> 0;
    header.writeUInt32BE(high, 2);
    header.writeUInt32BE(low, 6);
  }

  return Buffer.concat([header, payload]);
};

const decodeFrame = (buffer) => {
  if (buffer.length < 2) return null;
  const first = buffer[0];
  const second = buffer[1];
  const opcode = first & 0x0f;
  const isMasked = (second & 0x80) === 0x80;
  let len = second & 0x7f;
  let offset = 2;

  if (len === 126) {
    if (buffer.length < 4) return null;
    len = buffer.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buffer.length < 10) return null;
    const high = buffer.readUInt32BE(2);
    const low = buffer.readUInt32BE(6);
    len = high * 2 ** 32 + low;
    offset = 10;
  }

  let maskingKey;
  if (isMasked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  let payload = buffer.slice(offset, offset + len);
  if (isMasked) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return { opcode, payload: payload.toString() };
};

const sendJSON = (socket, payload) => {
  if (socket.destroyed) return;
  socket.write(encodeFrame(JSON.stringify(payload)));
};

const broadcast = (payload) => {
  const frame = encodeFrame(JSON.stringify(payload));
  for (const sock of clients.keys()) {
    if (!sock.destroyed) {
      sock.write(frame);
    }
  }
};

const server = http.createServer(serveFile);

server.on('upgrade', (req, socket) => {
  if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }

  const acceptKey = req.headers['sec-websocket-key'];
  if (!acceptKey) {
    socket.destroy();
    return;
  }

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${createAcceptValue(acceptKey)}`,
    '\r\n',
  ];
  socket.write(headers.join('\r\n'));

  clients.set(socket, null);

  const cleanup = () => {
    const name = clients.get(socket);
    if (name) {
      broadcast({ type: 'status', message: `${name} left the chat.` });
    }
    clients.delete(socket);
  };

  socket.on('data', (buffer) => {
    const frame = decodeFrame(buffer);
    if (!frame) return;
    const { opcode, payload } = frame;

    if (opcode === 0x8) {
      // close
      socket.end();
      cleanup();
      return;
    }

    if (opcode === 0x9) {
      // ping
      socket.write(encodeFrame(payload || '', 0x0a));
      return;
    }

    if (opcode !== 0x1) return; // only text frames

    let data;
    try {
      data = JSON.parse(payload);
    } catch (err) {
      sendJSON(socket, { type: 'error', message: 'Invalid message format.' });
      return;
    }

    const currentName = clients.get(socket);

    if (data.type === 'join') {
      const name = String(data.name || '').trim().slice(0, 30);
      if (!name) {
        sendJSON(socket, { type: 'error', message: 'Name is required to join.' });
        return;
      }
      clients.set(socket, name);
      sendJSON(socket, { type: 'system', message: `Welcome, ${name}!` });
      broadcast({ type: 'status', message: `${name} joined the chat.` });
      return;
    }

    if (!currentName) {
      sendJSON(socket, { type: 'error', message: 'Set your name before chatting.' });
      return;
    }

    if (data.type === 'chat') {
      const text = String(data.text || '').trim();
      if (!text) return;
      broadcast({ type: 'chat', from: currentName, text, timestamp: Date.now() });
    }
  });

  socket.on('end', cleanup);
  socket.on('close', cleanup);
  socket.on('error', cleanup);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
