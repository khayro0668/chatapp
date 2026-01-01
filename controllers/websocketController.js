const chatRoom = require('../models/chatRoom');
const { recordName } = require('../models/nameStore');
const { createAcceptValue, encodeFrame, decodeFrame } = require('./websocketFrames');

const sendJSON = (socket, payload) => {
  if (socket.destroyed) return;
  socket.write(encodeFrame(JSON.stringify(payload)));
};

const broadcast = (payload) => {
  const frame = encodeFrame(JSON.stringify(payload));
  for (const sock of chatRoom.sockets()) {
    if (!sock.destroyed) {
      sock.write(frame);
    }
  }
};

const handleTextMessage = (socket, rawPayload) => {
  let data;
  try {
    data = JSON.parse(rawPayload);
  } catch (err) {
    sendJSON(socket, { type: 'error', message: 'Invalid message format.' });
    return;
  }

  const currentName = chatRoom.getName(socket);

  if (data.type === 'join') {
    const name = String(data.name || '').trim().slice(0, 30);
    if (!name) {
      sendJSON(socket, { type: 'error', message: 'Name is required to join.' });
      return;
    }
    chatRoom.setName(socket, name);
    recordName(name);
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
};

const handleUpgrade = (req, socket) => {
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

  chatRoom.add(socket);

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    const name = chatRoom.remove(socket);
    if (name) {
      broadcast({ type: 'status', message: `${name} left the chat.` });
    }
  };

  socket.on('data', (buffer) => {
    const frame = decodeFrame(buffer);
    if (!frame) return;
    const { opcode, payload } = frame;

    if (opcode === 0x8) {
      socket.end();
      cleanup();
      return;
    }

    if (opcode === 0x9) {
      socket.write(encodeFrame(payload || '', 0x0a));
      return;
    }

    if (opcode !== 0x1) return;
    handleTextMessage(socket, payload);
  });

  socket.on('end', cleanup);
  socket.on('close', cleanup);
  socket.on('error', cleanup);
};

module.exports = {
  handleUpgrade,
};
