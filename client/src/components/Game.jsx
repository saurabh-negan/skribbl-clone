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
    setTimeLeft,
    setRound,
    resetGuessedPlayers,
    setScore,
    addGuessedPlayer,
    setAllScores, // NEW: overwrite scores
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

    socket.on("game_started", ({ round }) => {
      setGameStarted(true);
      if (typeof round === "number") setRound(round);
    });

    socket.on("choose_word", (wordList) => {
      if (isHost) setWordChoices(wordList);
    });

    socket.on("update_timer", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on("round_ended", ({ round: finishedRound }) => {
      setCanDraw(false);
      setWord("");
      setWordBlanks([]);
      resetGuessedPlayers();

      if (typeof finishedRound === "number") {
        setRound(finishedRound);
      }
    });

    socket.on("clear_canvas", () => {
      socket.emit("client_clear_canvas", { roomCode });
    });

    socket.on("set_word_blanks", ({ length }) => {
      setWordBlanks(Array(length).fill("_"));
    });

    socket.on("start_drawing", () => {
      setCanDraw(true);
    });

    // Award points on a correct guess (server sends points for the player who guessed)
    socket.on("correct_guess", ({ playerId, sender, points }) => {
      // apply delta (add)
      setScore(playerId, points);
      addGuessedPlayer(sender);
    });

    // Authoritative scoreboard sync (overwrite)
    socket.on("scores_update", ({ scores }) => {
      if (!scores) return;
      setAllScores(scores);
    });

    socket.on("game_over", ({ scores }) => {
      if (scores) {
        setAllScores(scores);
      }
    });

    return () => {
      socket.off("room_players");
      socket.off("game_started");
      socket.off("choose_word");
      socket.off("update_timer");
      socket.off("round_ended");
      socket.off("set_word_blanks");
      socket.off("start_drawing");
      socket.off("clear_canvas");
      socket.off("correct_guess");
      socket.off("scores_update");
      socket.off("game_over");
    };
  }, [
    name,
    color,
    roomCode,
    isHost,
    setPlayers,
    setGameStarted,
    setWordChoices,
    setTimeLeft,
    setCanDraw,
    setWord,
    setWordBlanks,
    setRound,
    resetGuessedPlayers,
    setScore,
    addGuessedPlayer,
    setAllScores,
  ]);

  const handleWordSelect = (word) => {
    setWord(word);
    setWordChoices([]);
    socket.emit("word_selected", { word, roomCode });
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
