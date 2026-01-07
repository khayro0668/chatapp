class ChatRoom {
  constructor() {
    this.clients = new Map(); // socket -> name
  }

  add(socket) {
    this.clients.set(socket, null);
  }

  setName(socket, name) {
    this.clients.set(socket, name);
  }

  getName(socket) {
    return this.clients.get(socket);
  }

  has(socket) {
    return this.clients.has(socket);
  }

  remove(socket) {
    const name = this.clients.get(socket) || null;
    this.clients.delete(socket);
    return name;
  }

  sockets() {
    return Array.from(this.clients.keys());
  }

  names() {
    return Array.from(this.clients.values()).filter(Boolean);
  }
}

module.exports = new ChatRoom();
