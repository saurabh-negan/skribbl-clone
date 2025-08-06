import { create } from "zustand";

const useUserStore = create((set) => ({
  name: "",
  color: "",
  roomCode: "",
  isHost: false,
  gameStarted: false,
  players: [],

  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

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

  currentWord: "",
  setCurrentWord: (word) => set({ currentWord: word }),
  word: "", // actual word for host
  wordBlanks: [], // array of "_" for guessers
  setWord: (word) => set({ word }),
  setWordBlanks: (blanks) => set({ wordBlanks: blanks }),

  guessedPlayers: [],
  addGuessedPlayer: (name) =>
    set((state) => ({
      guessedPlayers: [...state.guessedPlayers, name],
    })),
  resetGuessedPlayers: () => set({ guessedPlayers: [] }),

  // ✅ NEW additions below
  wordChoices: [],
  setWordChoices: (choices) => set({ wordChoices: choices }),

  canDraw: false,
  setCanDraw: (val) => set({ canDraw: val }),
}));

export default useUserStore;
