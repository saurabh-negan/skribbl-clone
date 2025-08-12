const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Room state shape: rooms[roomCode] = {
//   word: string,
//   round: number,
//   totalRounds: number,
//   currentDrawerId: socketId,
//   scores: { [socketId]: number },
//   timerHandle: NodeJS.Timeout (optional),
//   timeLeft: number
// }
const rooms = {};
const guessedThisRound = {}; // { roomCode: Set<socket.id> }
const roomTimers = {}; // active interval timers keyed by roomCode
const roomCleanupTimers = {}; // scheduled cleanup timeouts keyed by roomCode

const ROOM_TTL_MS = 60 * 1000; // keep empty room for 60s before final deletion
const allWords = ["apple", "car", "mountain", "river", "pencil", "sun", "tree"];

function getRandomWords() {
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

const ROUND_TIME = 60; // seconds
const MIN_POINTS = 100;
const MAX_POINTS = 1000;

// helper to compute points (hundreds-ish)
function computePoints(timeLeft, roundTime = ROUND_TIME) {
  const pct = Math.max(0, timeLeft) / roundTime; // 0..1
  const pts = Math.round(pct * MAX_POINTS);
  return Math.max(MIN_POINTS, pts);
}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_room", ({ name, color, roomCode }) => {
    // If a cleanup timeout was scheduled for this room, cancel it:
    if (roomCleanupTimers[roomCode]) {
      clearTimeout(roomCleanupTimers[roomCode]);
      delete roomCleanupTimers[roomCode];
      console.log(
        `Cleanup for room ${roomCode} cancelled because a player rejoined.`
      );
    }

    socket.join(roomCode);

    // If room does not exist, create basic room state
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        word: "",
        round: 0,
        totalRounds: 3,
        currentDrawerId: null,
        scores: {},
        timeLeft: ROUND_TIME,
      };
    }

    // figure out isHost (first in room)
    const room = io.sockets.adapter.rooms.get(roomCode);
    const isHost = room && room.size === 1;

    socket.data = { name, color, roomCode };

    // Add socket to room's score map if absent
    if (!rooms[roomCode].scores[socket.id]) {
      rooms[roomCode].scores[socket.id] = 0;
    }

    // Build players list with current scores and isHost flag
    const players = [];
    for (let [id, s] of io.sockets.sockets) {
      if (s.data && s.data.roomCode === roomCode) {
        players.push({
          id,
          name: s.data.name,
          color: s.data.color,
          isHost: rooms[roomCode].currentDrawerId === id, // mark current drawer
          score: rooms[roomCode].scores[id] || 0,
        });
      }
    }

    // Send success and players to everyone in room
    socket.emit("joined_room_success", { isHost, myId: socket.id });
    io.to(roomCode).emit("room_players", players);

    console.log(
      `Socket ${socket.id} joined room ${roomCode} (isHost=${isHost})`
    );
  });

  socket.on("start_game", ({ roomCode }) => {
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    if (!roomSockets) return;

    // init room state
    const roomState = rooms[roomCode] || {};
    roomState.round = 1;
    roomState.totalRounds = roomState.totalRounds || 3;
    roomState.timeLeft = ROUND_TIME;

    // choose first drawer as first socket in room
    const players = Array.from(roomSockets);
    const hostSocketId = players[0];
    roomState.currentDrawerId = hostSocketId;
    rooms[roomCode] = roomState;

    // reset guessed set
    guessedThisRound[roomCode] = new Set();

    // notify host to pick a word
    io.to(hostSocketId).emit("choose_word", getRandomWords());

    // notify all clients that game started
    io.to(roomCode).emit("game_started", {
      round: roomState.round,
      totalRounds: roomState.totalRounds,
    });

    // start timer for this room
    if (roomTimers[roomCode]) {
      clearInterval(roomTimers[roomCode]);
    }
    let timeLeft = ROUND_TIME;
    rooms[roomCode].timeLeft = timeLeft;
    io.to(roomCode).emit("update_timer", { timeLeft });

    roomTimers[roomCode] = setInterval(() => {
      timeLeft -= 1;
      rooms[roomCode].timeLeft = timeLeft;
      if (timeLeft >= 0) {
        io.to(roomCode).emit("update_timer", { timeLeft });
      }
      if (timeLeft <= 0) {
        clearInterval(roomTimers[roomCode]);
        delete roomTimers[roomCode];
        // end of round
        io.to(roomCode).emit("round_ended", { round: rooms[roomCode].round });
        io.to(roomCode).emit("clear_canvas");

        // move to next round or end game
        const currentRound = rooms[roomCode].round || 1;
        if (currentRound < rooms[roomCode].totalRounds) {
          // advance round
          rooms[roomCode].round = currentRound + 1;

          // rotate drawer to next player
          const playerIds = Array.from(roomSockets);
          let currentIndex = playerIds.indexOf(rooms[roomCode].currentDrawerId);
          if (currentIndex === -1) currentIndex = 0;
          const nextIndex = (currentIndex + 1) % playerIds.length;
          const nextDrawerId = playerIds[nextIndex];
          rooms[roomCode].currentDrawerId = nextDrawerId;

          // reset guessed set for new round
          guessedThisRound[roomCode] = new Set();

          // emit updated player list (so clients can update who is drawer)
          const playersList = [];
          for (let [id, s] of io.sockets.sockets) {
            if (s.data && s.data.roomCode === roomCode) {
              playersList.push({
                id,
                name: s.data.name,
                color: s.data.color,
                isHost: rooms[roomCode].currentDrawerId === id,
                score: rooms[roomCode].scores[id] || 0,
              });
            }
          }
          io.to(roomCode).emit("room_players", playersList);

          // tell the next drawer to choose a word
          io.to(nextDrawerId).emit("choose_word", getRandomWords());

          // start the timer for the next round
          let nextTime = ROUND_TIME;
          rooms[roomCode].timeLeft = nextTime;
          io.to(roomCode).emit("update_timer", { timeLeft: nextTime });

          roomTimers[roomCode] = setInterval(() => {
            nextTime -= 1;
            rooms[roomCode].timeLeft = nextTime;
            if (nextTime >= 0)
              io.to(roomCode).emit("update_timer", { timeLeft: nextTime });
            if (nextTime <= 0) {
              clearInterval(roomTimers[roomCode]);
              delete roomTimers[roomCode];
              io.to(roomCode).emit("round_ended", {
                round: rooms[roomCode].round,
              });
              io.to(roomCode).emit("clear_canvas");
              // continue rotation in next interval (could refactor to reuse logic)
            }
          }, 1000);
        } else {
          // game over - emit final scores
          io.to(roomCode).emit("game_over", {
            scores: rooms[roomCode].scores || {},
          });
        }
      }
    }, 1000);
  });

  socket.on("word_selected", ({ roomCode, word }) => {
    console.log(`Word "${word}" selected for room ${roomCode} by ${socket.id}`);
    if (!rooms[roomCode]) rooms[roomCode] = { scores: {} };
    rooms[roomCode].word = word;
    // reset guessed set
    guessedThisRound[roomCode] = new Set();

    // inform guessers with blanks
    socket.to(roomCode).emit("set_word_blanks", { length: word.length });

    // notify the host/drawer that drawing can begin (host already knows)
    io.to(socket.id).emit("start_drawing");
  });

  socket.on("chat_message", ({ roomCode, sender, text }) => {
    const roomData = rooms[roomCode];
    if (!roomData) {
      io.to(roomCode).emit("chat_message", { sender, text });
      return;
    }

    // check correct guess (case-insensitive)
    const guessedWord = text?.trim().toLowerCase();
    const actualWord = (roomData.word || "").toLowerCase();

    if (guessedWord && actualWord && guessedWord === actualWord) {
      // prevent duplicate scoring
      if (!guessedThisRound[roomCode]) guessedThisRound[roomCode] = new Set();
      if (!guessedThisRound[roomCode].has(socket.id)) {
        guessedThisRound[roomCode].add(socket.id);
        // compute points using timeLeft
        const timeLeft = roomData.timeLeft ?? ROUND_TIME;
        const pts = computePoints(timeLeft, ROUND_TIME);
        // award points
        rooms[roomCode].scores[socket.id] =
          (rooms[roomCode].scores[socket.id] || 0) + pts;

        // broadcast correct guess event and updated scores
        io.to(roomCode).emit("correct_guess", {
          playerId: socket.id,
          sender,
          points: pts,
        });
        // also broadcast the full scoreboard if needed
        io.to(roomCode).emit("scores_update", {
          scores: rooms[roomCode].scores,
        });

        return;
      }
    }

    // default: normal chat broadcast
    io.to(roomCode).emit("chat_message", { sender, text });
  });

  // relay drawing events
  socket.on("beginPath", ({ roomCode, x, y }) => {
    socket.to(roomCode).emit("beginPath", { x, y });
  });
  socket.on("drawing", ({ roomCode, x, y }) => {
    socket.to(roomCode).emit("drawing", { x, y });
  });
  socket.on("endPath", ({ roomCode }) => {
    socket.to(roomCode).emit("endPath");
  });

  socket.on("request_canvas_snapshot", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const drawerId = room.currentDrawerId;
    // If no drawer or drawer is the requester, nothing to do
    if (!drawerId || drawerId === socket.id) return;
    // ask the drawer to send a snapshot directly to this requester
    io.to(drawerId).emit("request_canvas_snapshot_to_drawer", {
      requesterId: socket.id,
    });
  });

  // Drawer sends the dataURL snapshot back — relay to the target client
  socket.on("canvas_snapshot", ({ roomCode, targetId, dataURL }) => {
    if (!targetId || !dataURL) return;
    // send only to the specific target
    io.to(targetId).emit("canvas_snapshot", { dataURL });
  });

  socket.on("client_clear_canvas", ({ roomCode }) => {
    socket.to(roomCode).emit("client_clear_canvas");
  });

  socket.on("disconnect", () => {
    const { roomCode } = socket.data || {};

    if (roomCode && rooms[roomCode]) {
      // Build updated players list for remaining sockets
      const playersList = [];
      for (let [id, s] of io.sockets.sockets) {
        if (s.data && s.data.roomCode === roomCode && id !== socket.id) {
          playersList.push({
            id,
            name: s.data.name,
            color: s.data.color,
            isHost: rooms[roomCode].currentDrawerId === id,
            score: rooms[roomCode].scores[id] || 0,
          });
        }
      }

      // Broadcast updated players list to remaining clients
      io.to(roomCode).emit("room_players", playersList);

      // If disconnected socket was the current drawer and room still has players,
      // rotate drawer immediately to next player so game can continue.
      const roomSocketIds = io.sockets.adapter.rooms.get(roomCode);
      if (
        rooms[roomCode].currentDrawerId === socket.id &&
        roomSocketIds &&
        roomSocketIds.size > 0
      ) {
        // pick first remaining socket as new drawer
        const remainingIds = Array.from(roomSocketIds);
        const newDrawerId = remainingIds[0];
        rooms[roomCode].currentDrawerId = newDrawerId;

        // notify new drawer to choose a word
        io.to(newDrawerId).emit("choose_word", getRandomWords());

        // broadcast updated players again (to mark new drawer)
        const updatedPlayersList = [];
        for (let [id, s] of io.sockets.sockets) {
          if (s.data && s.data.roomCode === roomCode) {
            updatedPlayersList.push({
              id,
              name: s.data.name,
              color: s.data.color,
              isHost: rooms[roomCode].currentDrawerId === id,
              score: rooms[roomCode].scores[id] || 0,
            });
          }
        }
        io.to(roomCode).emit("room_players", updatedPlayersList);
      }

      // If no clients remain in this room, schedule cleanup after TTL
      const currentRoom = io.sockets.adapter.rooms.get(roomCode);
      const roomEmpty = !currentRoom || currentRoom.size === 0;
      if (roomEmpty) {
        // clear interval if exists
        if (roomTimers[roomCode]) {
          clearInterval(roomTimers[roomCode]);
          delete roomTimers[roomCode];
        }

        // schedule final cleanup after TTL
        roomCleanupTimers[roomCode] = setTimeout(() => {
          // double-check room is still empty
          const nowRoom = io.sockets.adapter.rooms.get(roomCode);
          const stillEmpty = !nowRoom || nowRoom.size === 0;
          if (stillEmpty) {
            if (roomTimers[roomCode]) {
              clearInterval(roomTimers[roomCode]);
              delete roomTimers[roomCode];
            }
            delete rooms[roomCode];
            delete guessedThisRound[roomCode];
            delete roomCleanupTimers[roomCode];
            console.log(
              `Room ${roomCode} was empty for ${ROOM_TTL_MS}ms — cleaned up.`
            );
          } else {
            // somebody rejoined during TTL — cancel cleanup (shouldn't happen here because join cancels earlier)
            if (roomCleanupTimers[roomCode]) {
              clearTimeout(roomCleanupTimers[roomCode]);
              delete roomCleanupTimers[roomCode];
            }
          }
        }, ROOM_TTL_MS);

        console.log(
          `Room ${roomCode} is empty — scheduled cleanup in ${ROOM_TTL_MS}ms.`
        );
      }
    }

    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});
