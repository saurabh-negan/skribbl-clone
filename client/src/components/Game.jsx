import { useEffect } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";
import WaitingRoom from "./WaitingRoom";
import GameBoard from "./GameBoard";

function Game() {
  const { name, color, roomCode, gameStarted } = useUserStore();

  useEffect(() => {
    if (!name || !color || !roomCode) return;

    // Join the room once per page load
    if (!socket.hasJoinedRoom) {
      socket.emit("join_room", { name, color, roomCode });
      socket.hasJoinedRoom = true;
    }
  }, [name, color, roomCode]);

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex overflow-hidden">
      {gameStarted ? <GameBoard /> : <WaitingRoom />}
    </div>
  );
}

export default Game;
