# How it works (method by method)

## server.js
- `serveStatic(req, res)`: Serves files from `views/` and `/client.js` from `models/client.js`; guards against path traversal.
- `server = http.createServer(serveStatic)`: Creates the HTTP server.
- `wss = new WebSocket.Server({ server })`: Binds WebSocket server to the HTTP server.
- `server.listen(PORT)`: Starts listening.

## controllers/websocketController.js
- `sendJSON(socket, payload)`: Sends a JSON payload to one socket if open.
- `broadcast(wss, payload)`: Sends a JSON payload to every open socket.
- `handleTextMessage(wss, socket, rawPayload)`: Parses incoming JSON; supports `join` (sets name, announces, broadcasts current users) and `chat` (relays message); rejects unnamed senders.
- `setupWebsocket(wss)`: Hooks `connection`, wires `message`, `close`, `error`, tracks sockets in `chatRoom`, and announces joins/leaves (broadcasts user list).

## models/chatRoom.js
- `add(socket)`: Track a socket.
- `setName(socket, name)`: Attach a name to a socket.
- `getName(socket)`: Retrieve the name for a socket.
- `remove(socket)`: Remove tracking, return the name if it existed.
- `sockets()`: Array of tracked sockets.

## models/client.js (browser code)
- `connect(name)`: Opens WebSocket, sends `join`, updates UI state.
- `renderStatus(text)`, `renderChat({ from, text, timestamp })`: Append status/chat messages to the feed.
- Form handlers: submit name to join; submit chat to send `{ type: 'chat', text }`.

## Running
```bash
npm install
node server.js
# open http://localhost:3000
```
