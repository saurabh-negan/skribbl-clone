// components/GameBoard.jsx

import React from "react";
import CanvasBoard from "./CanvasBoard";

const GameBoard = ({
  canvasRef,
  startDrawing,
  draw,
  endDrawing,
  isHost,
  players,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      {/* Left: Player List */}
      <div className="w-1/6 bg-gray-800 text-white p-2">
        <h2 className="text-xl font-semibold mb-2">Players</h2>
        <ul>
          {players.map((p, i) => (
            <li key={i} className="mb-1" style={{ color: p.color }}>
              {p.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex items-center justify-center bg-white relative">
        <CanvasBoard
          canvasRef={canvasRef}
          isHost={isHost}
          startDrawing={startDrawing}
          draw={draw}
          endDrawing={endDrawing}
        />
      </div>

      {/* Right: Timer + Chat */}
      <div className="w-1/4 bg-gray-100 flex flex-col">
        {/* Top Right: Timer */}
        <div className="bg-red-500 text-white text-center p-2 font-semibold">
          Timer: 60s {/* Replace with actual timer state later */}
        </div>

        {/* Bottom Right: Chat */}
        <div className="flex-1 flex flex-col justify-between p-2">
          <div className="overflow-y-auto h-full mb-2 bg-white border rounded p-2">
            {/* Dummy chat messages for now */}
            <p>
              <b>Alice:</b> Is it a dog?
            </p>
            <p>
              <b>Bob:</b> Elephant?
            </p>
          </div>
          <input
            type="text"
            placeholder="Guess the word..."
            className="border p-2 rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
