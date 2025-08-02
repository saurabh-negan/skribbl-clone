
import useUserStore from './store/userStore';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const { name, color, setName, setColor } = useUserStore();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    navigate('/room');
  };

  return (
    <div className="h-screen w-screen bg-zinc-900 flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800 p-8 rounded-xl flex flex-col gap-6 shadow-lg w-[90%] max-w-md"
      >
        <h2 className="text-2xl font-bold text-center">Enter Your Info</h2>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 rounded bg-zinc-700 text-white outline-none"
          required
        />

        <div className="flex items-center justify-between">
          <label>Pick a color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 border-none"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 transition-colors py-2 px-4 rounded font-semibold"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

export default Welcome;
