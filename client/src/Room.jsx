import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from './store/userStore';

function Room() {
  const { name, color, setRoomCode, setIsHost } = useUserStore();
  const [roomCode, setRoomCodeInput] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoomCode);
    setIsHost(true);
    navigate(`/game/${newRoomCode}`);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    setRoomCode(roomCode);
    setIsHost(false);
    navigate(`/game/${roomCode}`);
  };

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white flex flex-col items-center justify-center gap-10 px-4">
      <h2 className="text-3xl font-bold">
  Welcome, <span style={{ color }}>{name}</span> 👋
</h2>

      <div className="flex flex-col md:flex-row gap-10 w-full max-w-2xl">
        {/* Create Room Section */}
        <div className="flex-1 bg-zinc-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Create a Room</h3>
          <button
            onClick={handleCreateRoom}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded w-full font-semibold"
          >
            Generate Room Code
          </button>
        </div>

        {/* Join Room Section */}
        <div className="flex-1 bg-zinc-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Join a Room</h3>
          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            className="p-3 rounded bg-zinc-700 text-white w-full outline-none mb-4"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded w-full font-semibold"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Room;
