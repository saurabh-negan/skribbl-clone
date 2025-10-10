import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "./store/userStore";

const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();
const randHex = () =>
  Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");

function Welcome() {
  const [nameInput, setNameInput] = useState("");
  const [colorInput, setColorInput] = useState("#" + randHex());
  const [error, setError] = useState("");

  const setName = useUserStore((s) => s.setName);
  const setColor = useUserStore((s) => s.setColor);
  const setRoomCode = useUserStore((s) => s.setRoomCode);
  const setIsHost = useUserStore((s) => s.setIsHost);

  const navigate = useNavigate();
  const nameOk = nameInput.trim().length > 0;

  const handleCreateRoom = () => {
    if (!nameOk) {
      setError("Please enter your name");
      return;
    }
    const newCode = generateRoomCode();
    setError("");
    setName(nameInput.trim());
    setColor(colorInput);
    setRoomCode(newCode);
    setIsHost(true);
    navigate(`/game/${newCode}`);
  };

  const handleJoinRoom = () => {
    if (!nameOk) {
      setError("Please enter your name");
      return;
    }
    const joinCode = prompt("Enter Room Code:");
    if (!joinCode) return;
    setError("");
    setName(nameInput.trim());
    setColor(colorInput);
    setRoomCode(joinCode.toUpperCase());
    setIsHost(false);
    navigate(`/game/${joinCode.toUpperCase()}`);
  };

  return (
    <div className="h-screen bg-zinc-800 text-white flex flex-col justify-center items-center gap-6">
      <h1 className="text-4xl font-bold">🎨 Skribbl Clone</h1>

      <input
        className="p-2 rounded bg-zinc-700"
        placeholder="Enter your name"
        value={nameInput}
        onChange={(e) => {
          setNameInput(e.target.value);
          if (error) setError("");
        }}
      />

      {error && <div className="text-red-400 text-sm -mt-3">{error}</div>}

      <div className="flex items-center gap-2">
        <label htmlFor="color">Pick a color:</label>
        <input
          type="color"
          id="color"
          value={colorInput}
          onChange={(e) => setColorInput(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded ${
            nameOk
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
          onClick={handleCreateRoom}
          disabled={!nameOk}
        >
          Create Room
        </button>
        <button
          className={`px-4 py-2 rounded ${
            nameOk
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
          onClick={handleJoinRoom}
          disabled={!nameOk}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Welcome;
