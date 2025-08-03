import { useEffect, useRef } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";
import WaitingRoom from "./WaitingRoom";
import GameBoard from "./GameBoard";

function Game() {
  const {
    name,
    color,
    roomCode,
    isHost,
    gameStarted,
    //players,
    setPlayers,
    setGameStarted,
  } = useUserStore();

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Drawing logic (only for host)
  const startDrawing = (e) => {
    if (!isHost || !contextRef.current) return;
    console.log("🖱️ Start drawing");

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
    console.log("✏️ Drawing...");
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
    if (!isDrawingRef.current) return; // ✅ only do stuff if drawing was happening
    console.log("🖐️ End drawing");
    isDrawingRef.current = false;

    if (contextRef.current) {
      contextRef.current.beginPath();
    }

    socket.emit("endPath", { roomCode });
  };

  // 🔌 Set up socket listeners and canvas context
  useEffect(() => {
    if (!name || !color || !roomCode) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      contextRef.current = ctx;
    }

    if (!socket.hasJoinedRoom) {
      socket.emit("join_room", { name, color, roomCode });
      socket.hasJoinedRoom = true;
    }

    socket.on("joined_room_success", ({ isHost: hostFlag }) => {
      console.log("✅ joined_room_success received. Host?", hostFlag);
      useUserStore.setState({ isHost: hostFlag });
    });

    socket.on("room_players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("game_started", () => {
      setGameStarted(true);
    });

    socket.on("drawing", ({ x, y }) => {
      const ctx = contextRef.current;
      if (!ctx || isHost) return;
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
      contextRef.current.beginPath();
    });

    // Debug logging
    socket.onAny((event, ...args) => {
      console.log(`📡 Socket Event: ${event}`, args);
    });

    return () => {
      socket.off("room_players");
      socket.off("game_started");
      socket.off("drawing");
      socket.off("beginPath");
      socket.off("endPath");
      socket.offAny();
    };
  }, [name, color, roomCode, isHost]);

  useEffect(() => {
    if (!gameStarted) return; // Important to avoid running early

    let interval;

    if (isHost) {
      interval = setInterval(() => {
        useUserStore.setState((state) => {
          const newTime = state.timeLeft - 1;

          socket.emit("update_timer", {
            roomCode: state.roomCode,
            timeLeft: newTime,
          });

          return { timeLeft: newTime > 0 ? newTime : 0 };
        });
      }, 1000);
    }

    // All players (including host) should listen
    socket.on("update_timer", ({ timeLeft }) => {
      useUserStore.setState({ timeLeft });
    });

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        contextRef.current = ctx;

        console.log("🎨 Canvas initialized");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      socket.off("update_timer");
    };
  }, [gameStarted, isHost]);

  console.log("🎮 Game Loaded - Host?", isHost);

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex overflow-hidden">
      {gameStarted ? (
        <GameBoard
          canvasRef={canvasRef}
          startDrawing={startDrawing}
          draw={draw}
          endDrawing={endDrawing}
          isHost={isHost}
        />
      ) : (
        <WaitingRoom />
      )}
    </div>
  );
}

export default Game;
