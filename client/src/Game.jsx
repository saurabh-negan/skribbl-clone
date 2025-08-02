import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useUserStore from "./store/userStore";
import socket from "./socket";

import { useRef } from "react";

function Game() {
  const { roomCode } = useParams();
  const { name, color, isHost } = useUserStore();

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const contextRef = useRef(null);

  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  // 1️⃣ Join the room on mount
  useEffect(() => {
    if (!name || !color || !roomCode) return;

    if (!socket.hasJoinedRoom) {
      socket.emit("join_room", { name, color, roomCode });
      socket.hasJoinedRoom = true; // flag it
    }
    // 2️⃣ Listen for player list updates
    socket.on("room_players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("game_started", () => {
      setGameStarted(true);
    });

    socket.on("drawing", ({ x, y }) => {
      const ctx = contextRef.current;
      if (!ctx || isHost) return; // Don't listen if you're the drawer

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    });
    socket.on("beginPath", () => {
      if (!contextRef.current || isHost) return;
      contextRef.current.beginPath();
    });

    socket.on("endPath", () => {
      if (!contextRef.current || isHost) return;
      contextRef.current.beginPath(); // or do nothing if you want
    });

    // 3️⃣ Clean up when component unmounts
    return () => {
      socket.off("room_players");
      socket.off("game_started");
      socket.off("drawing");
    };
  }, [name, color, roomCode, isHost]);

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;

    contextRef.current = ctx;
  }, [gameStarted]);

  // 4️⃣ Start game (host only)
  const handleStartGame = () => {
    socket.emit("start_game", roomCode);
  };

  const startDrawing = (e) => {
    if (!isHost) return; // Only drawer can draw (for now we assume host draws)
    isDrawingRef.current = true;
    draw(e); // start drawing immediately
    socket.emit("beginPath", { roomCode });
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !contextRef.current) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log("Drawing:", { x, y });

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Emit drawing to others
    socket.emit("drawing", { x, y, roomCode });
  };

  const endDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (!contextRef.current) return;
    contextRef.current.beginPath();

    socket.emit("endPath", { roomCode });
  };

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex overflow-hidden">
      {gameStarted ? (
        // 🎮 GAME UI
        <>
          {/* LEFT: Player List */}
          <aside className="w-1/5 bg-zinc-800 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Players</h2>
            <ul className="space-y-3">
              {players.map((player, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span>{player.name}</span>
                  <span className="ml-auto text-sm text-zinc-400">
                    Score: {player.score || 0}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* CENTER: Canvas Area */}
          <main className="flex-1 flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-2xl bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
            />
          </main>

          {/* RIGHT: Timer + Chat */}
          <aside className="w-1/4 bg-zinc-800 p-4 flex flex-col">
            {/* Timer & Round Info */}
            <div className="mb-4 bg-zinc-700 p-3 rounded-xl shadow-md text-sm">
              <p>
                ⏱️ Time Left: <span className="font-semibold">60s</span>
              </p>
              <p>
                🌀 Round: <span className="font-semibold">1 / 1</span>
              </p>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              <p className="text-sm text-zinc-400 italic">No messages yet.</p>
            </div>

            {/* Guess Input */}
            <form className="flex">
              <input
                type="text"
                placeholder="Type your guess..."
                className="flex-1 bg-zinc-700 px-4 py-2 rounded-l-xl text-white outline-none"
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-r-xl"
              >
                Send
              </button>
            </form>
          </aside>
        </>
      ) : (
        // ⏳ WAITING ROOM
        <div className="h-full w-full flex flex-col items-center justify-start p-6">
          <h1 className="text-3xl font-bold mb-2">Waiting Room</h1>
          <p className="text-lg text-zinc-300">
            Room Code:{" "}
            <span className="font-mono text-yellow-400">{roomCode}</span>
          </p>

          <div className="mt-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            <ul className="space-y-2">
              {players.map((player, index) => (
                <li
                  key={player.id || index}
                  className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span>{player.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handleStartGame}
              className="mt-10 bg-green-500 hover:bg-green-600 px-6 py-2 rounded font-semibold"
            >
              Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;
