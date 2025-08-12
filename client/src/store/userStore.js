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

  // SCORE keeping
  scores: {}, // { [socketId]: number }

  // add points (delta)
  setScore: (id, pts) =>
    set((state) => ({
      scores: {
        ...state.scores,
        [id]: (state.scores[id] || 0) + pts,
      },
    })),

  // overwrite all scores (authoritative sync from server)
  setAllScores: (newScores) =>
    set(() => ({
      // ensure keys are strings (socket ids) and values numbers
      scores: Object.fromEntries(
        Object.entries(newScores || {}).map(([k, v]) => [k, Number(v) || 0])
      ),
    })),

  resetScores: () => set({ scores: {} }),

  resetGuessedPlayers: () => set({ guessedPlayers: [] }),

  // word choices
  wordChoices: [],
  setWordChoices: (choices) => set({ wordChoices: choices }),

  canDraw: false,
  setCanDraw: (val) => set({ canDraw: val }),
}));

export default useUserStore;
