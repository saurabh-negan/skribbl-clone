// client/src/store/userStore.js
import { create } from "zustand";

const useUserStore = create((set, get) => ({
  // -------------------------
  // User / session info
  // -------------------------
  name: "",
  color: "",
  roomCode: "",
  isHost: false,
  gameStarted: false,

  setName: (name) => set({ name }),
  setColor: (color) => set({ color }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setIsHost: (isHost) => set({ isHost }),
  setGameStarted: (gameStarted) => set({ gameStarted }),

  // -------------------------
  // Player list & helpers
  // players: array of { id, name, color, isHost, isDrawer, score, hasGuessed }
  // -------------------------
  players: [],
  /**
   * Replace players array from server (room_players). This merges in any known
   * scores from the scores map stored locally.
   */
  setPlayers: (playersArray) =>
    set((state) => {
      const scores = state.scores || {};
      return {
        players: (playersArray || []).map((p) => ({
          // keep server-provided fields and ensure score is numeric
          id: p.id,
          name: p.name,
          color: p.color,
          isHost: !!p.isHost,
          isDrawer: !!p.isDrawer,
          score: Number(scores[p.id] ?? p.score ?? 0),
          hasGuessed: !!p.hasGuessed,
        })),
      };
    }),

  /**
   * Convenience: set players exactly as provided (no merging)
   * kept for compatibility if needed
   */
  setPlayersRaw: (playersArray) => set({ players: playersArray || [] }),

  // -------------------------
  // Chat/messages
  // -------------------------
  messages: [],
  setMessages: (msgs) => set({ messages: msgs || [] }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...(state.messages || []), msg],
    })),

  // -------------------------
  // Round / timer
  // -------------------------
  round: 1,
  totalRounds: 3,
  timeLeft: 60,
  setRound: (round) => set({ round }),
  setTotalRounds: (total) => set({ totalRounds: total }),
  setTimeLeft: (time) => set({ timeLeft: time }),

  // current drawer socket id
  currentDrawer: "",
  setCurrentDrawer: (id) => set({ currentDrawer: id }),

  // -------------------------
  // Secret word vs displayed state
  // -------------------------
  // secretWord = actual chosen word (only set for drawer/client that is drawer)
  secretWord: "",
  setSecretWord: (word) => set({ secretWord: word }),

  // safer setter that only sets secret when this client is the drawer
  setSecretWordIfDrawer: (drawerId, word) => {
    if (get().myId === drawerId) set({ secretWord: word });
  },

  // currentWord / wordBlanks are intended for guessers (displayed form)
  currentWord: "", // may contain blanks or full word for drawer
  wordBlanks: [], // e.g. ["_", "_", "_", "a", "_"]
  setCurrentWord: (cw) => set({ currentWord: cw }),
  setWordBlanks: (blanks) => set({ wordBlanks: blanks }),

  // -------------------------
  // Guessing state
  // -------------------------
  guessedPlayers: [], // array of names (sender) who guessed correctly this round
  addGuessedPlayer: (name) =>
    set((state) => ({
      guessedPlayers: [...(state.guessedPlayers || []), name],
    })),
  resetGuessedPlayers: () => set({ guessedPlayers: [] }),

  // mark player as hasGuessed (by id) and push name to guessedPlayers
  markPlayerGuessed: (playerId, senderName) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasGuessed: true } : p
      ),
      guessedPlayers: [...(state.guessedPlayers || []), senderName],
    })),

  // -------------------------
  // Scores (map) & helpers
  // -------------------------
  // scores is a map { [socketId]: number }
  scores: {},
  /**
   * Increment a single player's score (keeps previous value if present).
   * Name kept as setScore for backward compatibility but behaves as increment.
   */
  setScore: (id, pts) =>
    set((state) => ({
      scores: {
        ...state.scores,
        [id]: Number(state.scores[id] || 0) + Number(pts || 0),
      },
      players: state.players.map((p) =>
        p.id === id
          ? { ...p, score: Number(p.score || 0) + Number(pts || 0) }
          : p
      ),
    })),

  /**
   * Replace the entire scores map with normalized numeric values.
   * Also merges those scores into the players array (by id).
   */
  setAllScores: (newScores) =>
    set((state) => {
      const normalized = Object.fromEntries(
        Object.entries(newScores || {}).map(([k, v]) => [k, Number(v) || 0])
      );
      return {
        scores: normalized,
        players: state.players.map((p) => ({
          ...p,
          score: Number(normalized[p.id] ?? p.score ?? 0),
        })),
      };
    }),

  /**
   * Merge a scores map (server `scores_update`) into local store.
   * Keeps numeric conversion and updates players' score fields too.
   */
  mergeScoresToPlayers: (scoresMap) =>
    set((state) => {
      const normalized = Object.fromEntries(
        Object.entries(scoresMap || {}).map(([k, v]) => [k, Number(v) || 0])
      );
      return {
        scores: { ...(state.scores || {}), ...normalized },
        players: state.players.map((p) => ({
          ...p,
          score: Number(normalized[p.id] ?? p.score ?? 0),
        })),
      };
    }),

  // reset scores structure
  resetScores: () =>
    set({
      scores: {},
      players: (get().players || []).map((p) => ({ ...p, score: 0 })),
    }),

  // -------------------------
  // Word choices (host selection phase)
  // -------------------------
  wordChoices: [],
  setWordChoices: (choices) => set({ wordChoices: choices || [] }),
  clearWordChoices: () => set({ wordChoices: [] }),

  mySocketId: "",
  myId: "",
  setMySocketId: (id) => set({ mySocketId: id, myId: id }),
  setMyId: (id) => set({ myId: id, mySocketId: id }),
  // explicit boolean to show the word selection overlay
  isChoosingWord: false,
  setIsChoosingWord: (v) => set({ isChoosingWord: v }),

  // -------------------------
  // Canvas / drawing state
  // -------------------------
  canDraw: false,
  setCanDraw: (v) => set({ canDraw: v }),

  // -------------------------
  // Round lifecycle helpers
  // -------------------------
  /**
   * Reset state for a new round. Keeps player list (and optionally scores).
   */
  resetForNewRound: () =>
    set((state) => ({
      guessedPlayers: [],
      wordBlanks: [],
      wordChoices: [],
      canDraw: false,
      currentWord: "",
      secretWord: "",
      // keep scores & players, but clear any hasGuessed flags
      players: (state.players || []).map((p) => ({ ...p, hasGuessed: false })),
    })),

  /**
   * Handler for when server announces a correct guess.
   * This should be called with payload from server (playerId, sender).
   * It marks the player, records the name, and keeps players updated.
   */
  handleCorrectGuess: ({ playerId, sender }) =>
    set((state) => ({
      guessedPlayers: [...(state.guessedPlayers || []), sender],
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasGuessed: true } : p
      ),
    })),
}));

export default useUserStore;
