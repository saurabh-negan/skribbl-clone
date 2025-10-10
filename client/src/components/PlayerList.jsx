import useUserStore from "../store/userStore";

const PlayerList = () => {
  const { players = [], myId = "" } = useUserStore();

  // Scores are already merged into players by the store
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Players</h2>
      <ul className="space-y-2">
        {sorted.map((p) => {
          const isYou = p.id === myId;
          return (
            <li
              key={p.id}
              className="flex items-center justify-between bg-zinc-700 px-3 py-2 rounded"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>
                  {p.name}
                  {isYou && <span className="ml-1 opacity-70">(you)</span>}
                  {p.isDrawer && (
                    <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">
                      Drawer
                    </span>
                  )}
                </span>
              </div>
              <span className="text-sm text-gray-300">{p.score || 0} pts</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayerList;
