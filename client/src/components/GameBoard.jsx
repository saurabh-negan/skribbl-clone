import CanvasBoard from "./CanvasBoard";
import PlayerList from "./PlayerList";
import ChatBox from "./ChatBox";
import useUserStore from "../store/userStore";

const GameBoard = ({ canvasRef, startDrawing, draw, endDrawing, isHost }) => {
  //const { isHost } = useUserStore();
  const { round, totalRounds, timeLeft } = useUserStore();

  return (
    <div className="flex w-full h-full p-4 gap-4">
      {/* Left side - players */}
      <div className="w-1/5">
        <PlayerList />
      </div>

      {/* Middle - canvas */}
      <div className="flex-1 relative">
        {/* Timer + Round */}
        <div className="absolute top-2 right-2 bg-black/60 px-4 py-2 rounded text-white text-sm">
          <div>
            Round {round} of {totalRounds}
          </div>
          <div>⏳ {timeLeft}s</div>
        </div>

        <CanvasBoard
          canvasRef={canvasRef}
          startDrawing={startDrawing}
          draw={draw}
          isHost={isHost}
          endDrawing={endDrawing}
        />
      </div>

      {/* Right side - chat */}
      <div className="w-1/4">
        <ChatBox />
      </div>
    </div>
  );
};

export default GameBoard;
