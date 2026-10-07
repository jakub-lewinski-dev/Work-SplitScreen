const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the client folder (assuming 'client' is at the root level alongside 'server')
app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store documents state in memory
let documents = {
  left: "",
  right: ""
};

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Send current document state to the newly connected client
  socket.emit('init-document', documents);

  // Listen for text changes from any client
  socket.on('text-change', ({ panel, content }) => {
    documents[panel] = content;
    // Broadcast changes to all other clients in the LAN
    socket.broadcast.emit('text-change', { panel, content });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`LAN Server running on port ${PORT}`);
});