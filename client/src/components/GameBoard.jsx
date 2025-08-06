import CanvasBoard from "./CanvasBoard";
import PlayerList from "./PlayerList";
import ChatBox from "./ChatBox";
import useUserStore from "../store/userStore";

const GameBoard = () => {
  const { round, totalRounds, timeLeft } = useUserStore();

  return (
    <div className="flex w-full h-full p-4 gap-4 overflow-hidden">
      {/* Left side - players */}
      <div className="w-1/5 h-full overflow-y-auto">
        <PlayerList />
      </div>

      {/* Middle - canvas */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Canvas + Timer wrapper */}
        <div className="flex-1 relative bg-white rounded overflow-hidden">
          {/* Timer inside the white canvas container */}
          <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded text-white text-sm z-10">
            <div>
              Round {round} of {totalRounds}
            </div>
            <div>⏳ {timeLeft}s</div>
          </div>

          {/* Canvas fills this white area */}
          <CanvasBoard />
        </div>
      </div>

      {/* Right side - chat */}
      <div className="w-1/4 h-full">
        <ChatBox />
      </div>
    </div>
  );
};

export default GameBoard;
