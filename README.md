# WebSocket Group Chat

Simple WebSocket group chat. Users enter only a name, join the shared room, and chat in real time. Everything runs on plain JS/CSS/HTML with a tiny Node server (no external packages).

## Architecture
- Controllers: `controllers/staticController.js` serves the HTML/assets (serves `client.js` from `models/`); `controllers/websocketController.js` handles the WebSocket lifecycle and chat actions.
- Model: `models/chatRoom.js` tracks sockets and user names for the room; `models/nameStore.js` persists them to SQLite.
- Views: `views/` holds the HTML and CSS (client JS sits with models).
- Entry: `server.js` wires controllers to the HTTP server and upgrade event.

## Notes
- Database file: `chat.sqlite` is created in the project root automatically. Names are inserted on join.

## Run locally
```bash
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
