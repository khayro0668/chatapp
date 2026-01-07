# WebSocket Group Chat

Simple WebSocket group chat. Users enter only a name, join the shared room, and chat in real time. Everything runs on plain JS/CSS/HTML with a tiny Node server (no external packages).

## Architecture
- Controllers: `controllers/websocketController.js` uses the `ws` library to manage chat connections and messages.
- Models: `models/chatRoom.js` tracks sockets and user names; `models/client.js` is the browser-side script kept near the data layer for simplicity.
- Views: `views/` holds the HTML and CSS.
- Entry: `server.js` serves static files from `views/` and attaches `ws` to the HTTP server.

## Run locally
```bash
npm install
node server.js
# open http://localhost:3000
```

## Deploy (Render)
1. Push this folder to a new GitHub repo.
2. On Render.com, create a **Web Service**:
   - Build command: `npm install` (no dependencies, so it's fast)
   - Start command: `node server.js`
   - Root directory: repo root
3. Deploy; Render will expose a public URL you can share.

## Deploy (Railway)
1. Push to GitHub.
2. Create a new Railway project → **Deploy from Repo**.
3. Railway sets `PORT` automatically; no extra config required.
4. Deploy and share the generated URL.
