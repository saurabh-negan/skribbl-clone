import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "./store/userStore";

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

function Welcome() {
  const [nameInput, setNameInput] = useState("");
  const [colorInput, setColorInput] = useState(
    "#" + Math.floor(Math.random() * 16777215).toString(16)
  );

  const setName = useUserStore((s) => s.setName);
  const setColor = useUserStore((s) => s.setColor);
  const setRoomCode = useUserStore((s) => s.setRoomCode);
  const setIsHost = useUserStore((s) => s.setIsHost);

  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!nameInput.trim()) return;
    const newCode = generateRoomCode();

    setName(nameInput.trim());
    setColor(colorInput);
    setRoomCode(newCode);
    setIsHost(true);

    navigate(`/game/${newCode}`);
  };

  const handleJoinRoom = () => {
    const joinCode = prompt("Enter Room Code:");
    if (!nameInput.trim() || !joinCode) return;

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
        onChange={(e) => setNameInput(e.target.value)}
      />

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
          className="bg-green-600 px-4 py-2 rounded"
          onClick={handleCreateRoom}
        >
          Create Room
        </button>
        <button
          className="bg-blue-600 px-4 py-2 rounded"
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Welcome;
