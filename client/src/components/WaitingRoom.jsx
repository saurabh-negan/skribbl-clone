import useUserStore from "../store/userStore";
import socket from "../socket";

const WaitingRoom = () => {
  const { roomCode, players, isHost } = useUserStore();

  const handleStartGame = () => {
    console.log("🔘 Start button clicked");
    socket.emit("start_game", { roomCode });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <h2 className="text-3xl font-bold mb-4">Waiting Room</h2>
      <p className="mb-2 text-lg">
        <strong>Room Code:</strong> {roomCode}
      </p>

      <div className="w-full max-w-xs mb-4">
        <h3 className="text-xl font-semibold mb-2">Players:</h3>
        <ul className="space-y-2">
          {players.map((player, index) => (
            <li
              key={index}
              className="p-2 rounded bg-zinc-800 flex items-center justify-between"
            >
              <span
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <button
          onClick={handleStartGame}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default WaitingRoom;
