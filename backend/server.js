const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let currentContent = "Welcome to Collaborative Editor!\n\nStart typing here...";
let users = {};
let nextUserId = 1;

io.on('connection', (socket) => {
  console.log("✅ New user connected:", socket.id);
  
  // Wait for gender from frontend
  let userGender = 'neutral';
  
  socket.on("set-gender", (gender) => {
    userGender = gender;
    
    const userNumber = nextUserId;
    nextUserId++;
    
    users[socket.id] = {
      id: socket.id,
      name: "User " + userNumber,
      gender: userGender
    };
    
    console.log("User added:", users[socket.id]);
    
    socket.emit("init", {
      content: currentContent,
      users: Object.values(users)
    });
    
    socket.broadcast.emit("user-joined", users[socket.id]);
    io.emit("users-list", Object.values(users));
  });
  
  socket.on("text-change", (data) => {
    currentContent = data.content;
    socket.broadcast.emit("text-update", {
      content: data.content,
      userId: socket.id
    });
  });
  
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("user-left", socket.id);
    io.emit("users-list", Object.values(users));
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});