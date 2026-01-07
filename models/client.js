const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const joinButton = document.getElementById('joinButton');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const selfTag = document.getElementById('selfTag');
const messageFeed = document.getElementById('messages');
const connectedPanel = document.getElementById('connectedPanel');
const userList = document.getElementById('userList');
const userCount = document.getElementById('userCount');
const hint = document.querySelector('.hint');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let socket = null;
let userName = '';

const websocketUrl = () => location.origin.replace(/^http/, 'ws');

const setConnected = (isConnected, text) => {
  statusDot.classList.toggle('online', isConnected);
  statusText.textContent = text;
  messageInput.disabled = !isConnected;
  sendButton.disabled = !isConnected;
};

const toggleConnectedPanel = (show) => {
  if (show) {
    nameForm.classList.add('hidden');
    if (hint) hint.classList.add('hidden');
    connectedPanel.classList.remove('hidden');
  } else {
    nameForm.classList.remove('hidden');
    if (hint) hint.classList.remove('hidden');
    connectedPanel.classList.add('hidden');
  }
};

const setUsers = (names) => {
  userCount.textContent = names.length;
  userList.innerHTML = '';
  if (!names.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No one online';
    userList.appendChild(li);
    return;
  }

  names.forEach((name) => {
    const li = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = (name[0] || '?').toUpperCase();

    const label = document.createElement('span');
    label.textContent = name === userName ? `${name} (You)` : name;

    li.append(badge, label);
    userList.appendChild(li);
  });
};

const renderStatus = (text) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'message status-message';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  messageFeed.appendChild(wrapper);
  messageFeed.scrollTop = messageFeed.scrollHeight;
};

const renderChat = ({ from, text, timestamp }) => {
  const wrapper = document.createElement('div');
  const isSelf = from === userName;
  wrapper.className = `message${isSelf ? ' from-self' : ''}`;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = isSelf ? 'You' : from;

  const time = document.createElement('span');
  time.textContent = new Date(timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  meta.append(name, time);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  wrapper.append(meta, bubble);
  messageFeed.appendChild(wrapper);
  messageFeed.scrollTop = messageFeed.scrollHeight;
};

const clearEmptyState = () => {
  const empty = messageFeed.querySelector('.empty');
  if (empty) {
    empty.remove();
  }
};

const connect = (name) => {
 
  userName = name;
  setConnected(false, 'Connecting...');
  selfTag.textContent = '';
  selfTag.classList.add('hidden');
  setUsers([]);
  toggleConnectedPanel(false);

  socket = new WebSocket(websocketUrl());

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', name: userName }));
    setConnected(true, 'Connected');
    selfTag.textContent = `You are ${userName}`;
    selfTag.classList.remove('hidden');
    clearEmptyState();
    renderStatus(`Joined as ${userName}.`);
    messageInput.focus();
    toggleConnectedPanel(true);
  });

  socket.addEventListener('message', (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (err) {
      return;
    }

    if (data.type === 'chat') {
      clearEmptyState();
      renderChat(data);
      return;
    }

    if (data.type === 'status' || data.type === 'system') {
      clearEmptyState();
      renderStatus(data.message);
      return;
    }

    if (data.type === 'users') {
      setUsers(data.names || []);
      return;
    }

    if (data.type === 'error') {
      renderStatus(`Error: ${data.message}`);
    }
  });

  socket.addEventListener('close', () => {
    setConnected(false, 'Disconnected');
    renderStatus('Connection closed. Join again to re-enter.');
    setUsers([]);
    toggleConnectedPanel(false);
  });

  socket.addEventListener('error', () => {
    setConnected(false, 'Connection error');
  });
};

nameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  joinButton.disabled = true;
  joinButton.textContent = 'Connecting...';
  connect(name);

  
  setTimeout(() => {
    joinButton.disabled = false;
    joinButton.textContent = 'Join chat';
  }, 700);
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'chat', text }));
  messageInput.value = '';
});
