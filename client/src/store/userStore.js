import { create } from "zustand";

const useUserStore = create((set) => ({
  name: "",
  color: "",
  roomCode: "",
  isHost: false,
  gameStarted: false,
  players: [],

  messages: [],
  setMessages: (updateFn) =>
    set((state) => ({ messages: updateFn(state.messages) })),

  round: 1,
  totalRounds: 3,
  timeLeft: 60,
  setRound: (round) => set({ round }),
  setTotalRounds: (total) => set({ totalRounds: total }),
  setTimeLeft: (time) => set({ timeLeft: time }),

  setName: (name) => set({ name }),
  setColor: (color) => set({ color }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setIsHost: (isHost) => set({ isHost }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setPlayers: (players) => set({ players }),
}));

export default useUserStore;
