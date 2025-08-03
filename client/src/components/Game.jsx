import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useUserStore from "../store/userStore";
import socket from "../socket";
import WaitingRoom from "./WaitingRoom";
import GameBoard from "./GameBoard";

import { useRef } from "react";

function Game() {
  const { roomCode } = useParams();
  const { name, color, isHost } = useUserStore();

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const contextRef = useRef(null);

  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    console.log("Start button clicked");
    socket.emit("start_game", { roomCode });
  };

  const startDrawing = (e) => {
    if (!isHost || !contextRef.current) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);

    socket.emit("beginPath", { roomCode });
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !contextRef.current) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    socket.emit("drawing", { x, y, roomCode });
  };

  const endDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (!contextRef.current) return;
    contextRef.current.beginPath();

    socket.emit("endPath", { roomCode });
  };

  // 1️⃣ Join the room on mount
  useEffect(() => {
    if (!name || !color || !roomCode) return;

    if (!socket.hasJoinedRoom) {
      socket.emit("join_room", { name, color, roomCode }, (ack) => {
        console.log("Joined room successfully", ack); // Optional
      });
      socket.hasJoinedRoom = true; // flag it
    }
    // 2️⃣ Listen for player list updates
    console.log("Setting up socket listeners...");
    socket.on("room_players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
    console.log("Listening for game_started");
    socket.on("game_started", () => {
      console.log("Game started event received");
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
    socket.onAny((event, ...args) => {
      console.log(`🔍 Received event: ${event}`, args);
    });

    // 3️⃣ Clean up when component unmounts
    return () => {
      socket.off("room_players");
      socket.off("game_started");
      socket.off("drawing");
    };
  }, [name, color, roomCode, isHost]);

  // useEffect(() => {
  //   if (!gameStarted) return;

  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   canvas.width = canvas.offsetWidth;
  //   canvas.height = canvas.offsetHeight;

  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   ctx.lineCap = "round";
  //   ctx.strokeStyle = "black";
  //   ctx.lineWidth = 4;

  //   contextRef.current = ctx;
  // }, [gameStarted]);

  // 4️⃣ Start game (host only)
  // const handleStartGame = () => {
  //   socket.emit("start_game", { roomCode });
  // };

  // const startDrawing = (e) => {
  //   if (!isHost) return; // Only drawer can draw (for now we assume host draws)
  //   isDrawingRef.current = true;
  //   draw(e); // start drawing immediately
  //   socket.emit("beginPath", { roomCode });
  // };

  // const draw = (e) => {
  //   if (!isDrawingRef.current || !contextRef.current) return;

  //   const canvas = canvasRef.current;
  //   const ctx = contextRef.current;

  //   const rect = canvas.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;
  //   console.log("Drawing:", { x, y });

  //   ctx.lineTo(x, y);
  //   ctx.stroke();
  //   ctx.beginPath();
  //   ctx.moveTo(x, y);

  //   // Emit drawing to others
  //   socket.emit("drawing", { x, y, roomCode });
  // };

  // const endDrawing = () => {
  //   if (!isDrawingRef.current) return;
  //   isDrawingRef.current = false;
  //   if (!contextRef.current) return;
  //   contextRef.current.beginPath();

  //   socket.emit("endPath", { roomCode });
  // };

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex overflow-hidden">
      {gameStarted ? (
        <GameBoard
          canvasRef={canvasRef}
          contextRef={contextRef}
          isHost={isHost}
          players={players}
          name={name}
          color={color}
          roomCode={roomCode}
          startDrawing={startDrawing}
          draw={draw}
          endDrawing={endDrawing}
        />
      ) : (
        // ⏳ WAITING ROOM
        <WaitingRoom
          players={players}
          isHost={isHost}
          handleStartGame={handleStartGame}
          roomCode={roomCode}
        />
      )}
    </div>
  );
}

export default Game;
