import CanvasBoard from "./CanvasBoard";
import PlayerList from "./PlayerList";
import useUserStore from "../store/userStore";

const GameBoard = ({ canvasRef, startDrawing, draw, endDrawing }) => {
  const { isHost } = useUserStore();

  return (
    <div className="flex w-full h-full">
      {/* LEFT: Player List */}
      <div className="w-1/5 bg-zinc-800 p-4 overflow-y-auto">
        <PlayerList />
      </div>

      {/* MIDDLE: Drawing Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-2">
        <div className="relative w-full h-full max-w-[900px] max-h-[600px] border border-zinc-700 rounded-xl overflow-hidden">
          <CanvasBoard
            canvasRef={canvasRef}
            isHost={isHost}
            startDrawing={startDrawing}
            draw={draw}
            endDrawing={endDrawing}
          />
        </div>
      </div>

      {/* RIGHT: Timer and Chat (we’ll build chat later) */}
      <div className="w-1/5 bg-zinc-800 p-4 flex flex-col justify-start">
        <div className="text-white text-lg font-semibold mb-4 text-right">
          ⏱️ Timer: 60s {/* hardcoded for now */}
        </div>
        <div className="flex-1 bg-zinc-700 rounded p-2">
          <p className="text-sm text-gray-300">💬 Chat coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
