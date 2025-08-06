import { useEffect } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";
import WaitingRoom from "./WaitingRoom";
import GameBoard from "./GameBoard";
import WordSelector from "./WordSelector";

function Game() {
  const {
    name,
    color,
    roomCode,
    isHost,
    gameStarted,
    setPlayers,
    setGameStarted,
    wordChoices,
    setWordChoices,
    setWord,
    setCanDraw,
    setWordBlanks,
  } = useUserStore();

  useEffect(() => {
    if (!name || !color || !roomCode) return;

    if (!socket.hasJoinedRoom) {
      socket.emit("join_room", { name, color, roomCode });
      socket.hasJoinedRoom = true;
    }

    socket.on("room_players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("game_started", () => {
      setGameStarted(true);
    });

    socket.on("choose_word", (wordList) => {
      if (isHost) setWordChoices(wordList);
    });

    // Receive blanks for guessers
    socket.on("set_word_blanks", ({ length }) => {
      setWordBlanks(Array(length).fill("_"));
    });

    // Host starts drawing on server emit
    socket.on("start_drawing", () => {
      setCanDraw(true);
    });

    return () => {
      socket.off("room_players");
      socket.off("game_started");
      socket.off("choose_word");
      socket.off("set_word_blanks");
      socket.off("start_drawing");
    };
  }, [name, color, roomCode, isHost]);

  const handleWordSelect = (word) => {
    setWord(word);
    setWordChoices([]);
    socket.emit("word_selected", { word, roomCode });
    // No client-side start_drawing emit anymore
  };

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex overflow-hidden">
      {gameStarted ? (
        <>
          {isHost && wordChoices.length > 0 && (
            <WordSelector
              wordChoices={wordChoices}
              onSelect={handleWordSelect}
            />
          )}
          <GameBoard />
        </>
      ) : (
        <WaitingRoom />
      )}
    </div>
  );
}

export default Game;
