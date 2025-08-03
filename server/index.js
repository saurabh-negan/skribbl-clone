const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend dev
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_room", ({ name, color, roomCode }) => {
    socket.join(roomCode);

    // ✅ Get size of the room to determine if host or not
    const room = io.sockets.adapter.rooms.get(roomCode);
    const isHost = room && room.size === 1;

    // Save to socket's data
    socket.data = { name, color, roomCode, isHost };

    // ✅ Emit this info back to that socket only
    socket.emit("joined_room_success", { isHost });

    // ✅ Emit updated player list to everyone in the room
    const players = [];
    for (let [id, s] of io.sockets.sockets) {
      if (s.data.roomCode === roomCode) {
        players.push({
          id,
          name: s.data.name,
          color: s.data.color,
          isHost: s.data.isHost,
        });
      }
    }

    io.to(roomCode).emit("room_players", players);
  });

  socket.on("start_game", ({ roomCode }) => {
    console.log("Game started in room:", roomCode);
    io.to(roomCode).emit("game_started");
  });

  socket.on("beginPath", ({ roomCode }) => {
    socket.to(roomCode).emit("beginPath");
  });

  socket.on("drawing", ({ x, y, roomCode }) => {
    socket.to(roomCode).emit("drawing", { x, y });
  });

  socket.on("endPath", ({ roomCode }) => {
    socket.to(roomCode).emit("endPath");
  });

  socket.on("disconnect", () => {
    const { roomCode } = socket.data || {};
    if (roomCode && rooms[roomCode]) {
      rooms[roomCode] = rooms[roomCode].filter(
        (p) => p.name !== socket.data.name
      );
      io.to(roomCode).emit("room_players", rooms[roomCode]);
    }
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});
