const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" }
});

let currentContent = "Welcome to Collaborative Editor!\n\nStart typing...";
let users = {};

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);
  
  users[socket.id] = { 
    id: socket.id, 
    name: "User " + Object.keys(users).length 
  };
  
  socket.emit("init", { 
    content: currentContent, 
    users: Object.values(users) 
  });
  
  socket.broadcast.emit("user-joined", users[socket.id]);
  
  socket.on("update", (data) => {
    currentContent = data.content;
    socket.broadcast.emit("update", { 
      content: data.content, 
      userId: socket.id 
    });
  });
  
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user-left", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on http://localhost:5000"));