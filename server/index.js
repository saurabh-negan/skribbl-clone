const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Allow frontend to connect from localhost:5173
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend dev URL
    methods: ["GET", "POST"],
  },
});

// Store rooms in memory (temporary)
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Handle joining a room
  socket.on("join_room", ({ name, color, roomCode }) => {
    socket.join(roomCode);
    console.log(`${name} joined room ${roomCode}`);
    if (!rooms[roomCode]) rooms[roomCode] = [];

    // ✅ Prevent duplicate player entries
    const alreadyInRoom = rooms[roomCode].some((p) => p.id === socket.id);
    if (!alreadyInRoom) {
      rooms[roomCode].push({ id: socket.id, name, color });
    }

    io.to(roomCode).emit("room_players", rooms[roomCode]);
    console.log(`👥 ${name} joined room ${roomCode}`);
    socket.emit("joined_room_success", { success: true });
  });

  //on drawing event
  socket.on("drawing", ({ x, y, roomCode }) => {
    socket.to(roomCode).emit("drawing", { x, y });
  });

  socket.on("beginPath", ({ roomCode }) => {
    socket.to(roomCode).emit("beginPath");
  });

  socket.on("endPath", ({ roomCode }) => {
    socket.to(roomCode).emit("endPath");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((p) => p.id !== socket.id);
      io.to(room).emit("room_players", rooms[room]);
    }
    console.log("❌ User disconnected:", socket.id);
  });

  // Handle starting game
  socket.on("start_game", ({ roomCode }) => {
    console.log("🧠 Game started in room:", roomCode);
    console.log("👉 Emitting game_started to room", roomCode);
    io.to(roomCode).emit("game_started");
  });
});

server.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
