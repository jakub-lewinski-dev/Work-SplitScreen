const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const files = new Map();

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.emit('files-state', Array.from(files, ([fileName, content]) => ({ fileName, content })));

  socket.on('open-file', (requestedName, acknowledge) => {
    let fileName = requestedName;
    let suffix = 2;

    while (files.has(fileName)) {
      fileName = `${requestedName.replace(/\.[^/.]+$/, '')} (${suffix})${path.extname(requestedName)}`;
      suffix++;
    }

    const initialContent = '';
    files.set(fileName, initialContent);
    socket.broadcast.emit('file-added', { fileName, content: initialContent });
    if (typeof acknowledge === 'function') acknowledge(fileName);
  });

  socket.on('file-content-change', ({ fileName, content }) => {
    if (!files.has(fileName)) return;

    files.set(fileName, content);
    socket.broadcast.emit('file-content-change', { fileName, content });
  });

  socket.on('rename-file', ({ oldName, newName }, acknowledge) => {
    if (!files.has(oldName) || typeof newName !== 'string' || !newName.trim() || files.has(newName)) {
      if (typeof acknowledge === 'function') acknowledge(false);
      return;
    }

    files.set(newName, files.get(oldName));
    files.delete(oldName);
    socket.broadcast.emit('file-renamed', { oldName, newName });
    if (typeof acknowledge === 'function') acknowledge(true);
  });

  socket.on('delete-file', (fileName) => {
    if (!files.delete(fileName)) return;
    socket.broadcast.emit('file-deleted', fileName);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`LAN Server running on port ${PORT}`);
});