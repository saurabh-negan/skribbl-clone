// GameBoard.jsx
import CanvasBoard from "./CanvasBoard";
import PlayerList from "./PlayerList";
import ChatBox from "./ChatBox";
import useUserStore from "../store/userStore";

const GameBoard = () => {
  const { round, totalRounds, timeLeft } = useUserStore();

  return (
    <div className="flex w-full h-full gap-4 p-4">
      {/* Left side - players */}
      <div className="w-1/5 h-full overflow-y-auto p-2">
        <PlayerList />
      </div>

      {/* Middle - canvas */}
      <div className="flex-1 relative flex flex-col">
        {/* Canvas wrapper: relative so CanvasBoard (absolute) fills it */}
        <div
          className="flex-1 relative bg-white rounded overflow-hidden"
          style={{
            // show visual debug outline so we can see edges clearly
            outline: "1px dashed rgba(0,0,0,0.08)",
          }}
        >
          {/* Canvas is absolute and will fill this container */}
          <CanvasBoard />

          {/* Timer overlay: visually on top but doesn't block pointer events */}
          <div
            className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded text-white text-sm"
            style={{
              zIndex: 200,
              pointerEvents: "none", // guaranteed, inline style
            }}
          >
            <div>
              Round {round} of {totalRounds}
            </div>
            <div>⏳ {timeLeft}s</div>
          </div>
        </div>
      </div>

      {/* Right side - chat */}
      <div className="w-1/4 h-full p-2">
        <ChatBox />
      </div>
    </div>
  );
};

export default GameBoard;
