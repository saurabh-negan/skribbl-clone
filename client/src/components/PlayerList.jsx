import useUserStore from "../store/userStore";

const PlayerList = () => {
  const { players, scores } = useUserStore();

  // Combine players with scores and sort descending
  const playersWithScores = players
    .map((p) => ({
      ...p,
      score: scores[p.id] || 0,
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Players</h2>
      <ul className="space-y-2">
        {playersWithScores.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between bg-zinc-700 px-3 py-2 rounded"
          >
            <div className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.name}</span>
            </div>
            <span className="text-sm text-gray-300">
              {player.score || 0} pts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
