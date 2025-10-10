import useUserStore from "../store/userStore";
import socket from "../socket";

const WordSelection = () => {
  const {
    wordChoices = [],
    roomCode,
    setIsChoosingWord,
    clearWordChoices,
  } = useUserStore();

  if (!wordChoices.length) return null;

  const selectWord = (word) => {
    // Drawer picks; server will confirm and broadcast round start
    socket.emit("word_selected", { roomCode, word });
    // Close selector locally
    setIsChoosingWord?.(false);
    clearWordChoices?.();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white bg-zinc-900/95">
      <h2 className="text-2xl font-bold mb-4">Choose a Word</h2>
      <div className="flex flex-wrap gap-3">
        {wordChoices.map((word, idx) => (
          <button
            key={idx}
            onClick={() => selectWord(word)}
            className="bg-green-700 px-4 py-2 rounded hover:bg-green-600"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WordSelection;
