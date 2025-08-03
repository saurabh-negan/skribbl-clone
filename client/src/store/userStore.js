import { create } from "zustand";

const useUserStore = create((set) => ({
  name: "",
  color: "",
  roomCode: "",
  isHost: false,
  gameStarted: false,
  players: [],

  setName: (name) => set({ name }),
  setColor: (color) => set({ color }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setIsHost: (isHost) => set({ isHost }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setPlayers: (players) => set({ players }),
}));

export default useUserStore;
