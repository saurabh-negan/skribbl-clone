import useUserStore from "../store/userStore";

const PlayerList = () => {
  const { players } = useUserStore();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Players</h2>
      <ul className="space-y-2">
        {players.map((player, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-zinc-700 px-3 py-2 rounded"
          >
            <div className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.name}</span>
            </div>
            <span className="text-sm text-gray-300">0 pts</span>{" "}
            {/* Score placeholder */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
