// components/WaitingRoom.jsx
import React from "react";

const WaitingRoom = ({ players, isHost, handleStartGame, roomCode }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h2 className="text-2xl font-semibold mb-4">Waiting for players...</h2>
      <p className="mb-2">
        Room Code: <strong>{roomCode}</strong>
      </p>
      <ul className="mb-4">
        {players.map((p, i) => (
          <li key={i} className="text-lg" style={{ color: p.color }}>
            {p.name}
          </li>
        ))}
      </ul>
      {isHost && (
        <button
          onClick={handleStartGame}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default WaitingRoom;
