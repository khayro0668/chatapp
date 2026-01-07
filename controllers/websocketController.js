const chatRoom = require('../models/chatRoom');

const sendJSON = (socket, payload) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const broadcast = (wss, payload) => {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
};

const handleTextMessage = (wss, socket, rawPayload) => {
  let data;
  try {
    data = JSON.parse(rawPayload.toString());
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
    sendJSON(socket, { type: 'system', message: `Welcome, ${name}!` });
    broadcast(wss, { type: 'status', message: `${name} joined the chat.` });
    broadcast(wss, { type: 'users', names: chatRoom.names() });
    return;
  }

  if (!currentName) {
    sendJSON(socket, { type: 'error', message: 'Set your name before chatting.' });
    return;
  }

  if (data.type === 'chat') {
    const text = String(data.text || '').trim();
    if (!text) return;
    broadcast(wss, { type: 'chat', from: currentName, text, timestamp: Date.now() });
  }
};

const setupWebsocket = (wss) => {
  wss.on('connection', (socket) => {
    chatRoom.add(socket);

    const cleanup = () => {
      const name = chatRoom.remove(socket);
      if (name) {
        broadcast(wss, { type: 'status', message: `${name} left the chat.` });
        broadcast(wss, { type: 'users', names: chatRoom.names() });
      }
    };

    socket.on('message', (data) => handleTextMessage(wss, socket, data));
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });
};

module.exports = {
  setupWebsocket,
};
