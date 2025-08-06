import useUserStore from "../store/userStore";
import socket from "../socket";

const WordSelection = () => {
  const { wordChoices, roomCode, setWord, setWordChoices } = useUserStore();

  const selectWord = (word) => {
    setWord(word);
    setWordChoices([]); // Hide this component
    socket.emit("word_selected", { word, roomCode });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white bg-zinc-900">
      <h2 className="text-2xl font-bold mb-4">Choose a Word</h2>
      <div className="flex space-x-4">
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
