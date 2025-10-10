// GameBoard.jsx
import CanvasBoard from "./CanvasBoard";
import PlayerList from "./PlayerList";
import ChatBox from "./ChatBox";
import WordSelector from "./WordSelector";
import useUserStore from "../store/userStore";
import socket from "../socket";

/**
 * GameBoard (cleaned)
 * - Uses global store for choose-word overlay + options (no local fallback)
 * - Emits "word_selected" with roomCode and word, then waits for server's round_started
 * - CanvasBoard receives overlayActive and will block pointer events while overlay is open
 */
const GameBoard = () => {
  const {
    round = 0,
    totalRounds = 0,
    timeLeft = 0,
    isChoosingWord = false,
    wordChoices = [], // <- read word options from store (set by socket.js)
    players = [],
    roomCode,
  } = useUserStore();

  // derive current drawer + name from players
  const drawerPlayer = players.find((p) => p.isDrawer);
  const drawerName = drawerPlayer?.name || "";

  // Called when a word is chosen from the UI
  const handleChoose = (word) => {
    console.log("[client debug] chosen word:", word);
    // Emit chosen word to server — server expects "word_selected"
    // Do NOT enable drawing locally here; wait for server's "round_started"
    socket.emit("word_selected", { roomCode, word });
  };

  // show overlay only if store says so
  const showOverlay = Boolean(isChoosingWord);

  return (
    <div className="flex w-full h-full gap-4 p-4">
      {/* Left side - players */}
      <div className="w-1/5 h-full overflow-y-auto p-2">
        <PlayerList />
      </div>

      {/* Middle - canvas */}
      <div className="flex-1 relative flex flex-col">
        <div
          className="flex-1 relative bg-white rounded overflow-hidden"
          style={{ outline: "1px dashed rgba(0,0,0,0.08)" }}
        >
          {/* Canvas: pass overlayActive so CanvasBoard can disable pointer events when overlay is open */}
          <CanvasBoard overlayActive={showOverlay} />

          {/* Word selection overlay (only while drawer is choosing) */}
          {showOverlay && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{
                pointerEvents: "auto",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WordSelector options={wordChoices} onChoose={handleChoose} />
            </div>
          )}

          {/* Timer/round overlay */}
          <div
            className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded text-white text-sm"
            style={{ zIndex: 200, pointerEvents: "none" }}
          >
            <div>
              Round {round} of {totalRounds}
            </div>
            <div>⏳ {timeLeft}s</div>
            {drawerName && (
              <div className="text-xs opacity-80">Drawer: {drawerName}</div>
            )}
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
