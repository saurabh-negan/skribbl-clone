// client/src/socket.js
import { io } from "socket.io-client";
import useUserStore from "./store/userStore";

const socket = io("http://localhost:3001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * initSocket - attaches all global socket listeners and wires them to your Zustand store.
 * Safe to call multiple times; uses an internal guard to avoid duplicated handlers.
 */
let initialized = false;
const listeners = [];

export function initSocket() {
  if (initialized) return;
  initialized = true;

  const store = useUserStore.getState();
  socket.on("connect", () => {
    console.log("[socket] connected as", socket.id);
    store.setMyId?.(socket.id);
  });
  const reg = (event, handler) => {
    socket.on(event, handler);
    listeners.push({ event, handler });
  };

  // 1) After joining a room successfully
  reg("joined_room_success", (payload) => {
    if (!payload) return;
    const { isHost, myId } = payload;
    if (typeof isHost !== "undefined") store.setIsHost?.(isHost);
    if (myId) {
      // set my socket id so client can compare with drawerId later
      store.setMyId?.(myId);
    }
  });

  // 2) Authoritative players list
  reg("room_players", (players) => {
    store.setPlayers?.(players || []);
  });

  // 3) choose_word -> drawer receives word choices (normalize payload)
  reg("choose_word", (payload) => {
    // Debug: show exactly what server sent for choose_word
    console.log("[socket] choose_word payload:", payload);

    const options = Array.isArray(payload)
      ? payload
      : (payload &&
          (payload.words ||
            payload.options ||
            payload.wordsList ||
            payload.wordArray)) ||
        [];

    console.log("[socket] normalized word options:", options);

    store.setWordChoices?.(options);
    store.setIsChoosingWord?.(true);
  });

  // 4) game started
  reg("game_started", ({ round, totalRounds } = {}) => {
    if (typeof round !== "undefined") store.setRound?.(round);
    if (typeof totalRounds !== "undefined") store.setTotalRounds?.(totalRounds);
    store.resetForNewRound?.(); // clear round-local UI state
    store.setGameStarted?.(true);
  });

  // 4.5)
  // round_started -> authoritative start of the round
  // round_started -> authoritative start of the round
  reg("round_started", (data = {}) => {
    // data: { drawerId, round, totalRounds, timeLeft, wordMask? }
    const { drawerId, round, totalRounds, timeLeft, wordMask } = data;

    // 1) update round metadata
    if (typeof round !== "undefined") store.setRound?.(round);
    if (typeof totalRounds !== "undefined") store.setTotalRounds?.(totalRounds);
    if (typeof timeLeft !== "undefined") store.setTimeLeft?.(timeLeft);

    // 2) Close any choose-word overlay for everyone (prevents stuck grey screens)
    store.setIsChoosingWord?.(false);
    store.clearWordChoices?.();

    // 3) Set current drawer id in store (so UI can highlight)
    if (store.setCurrentDrawer) store.setCurrentDrawer(drawerId || "");

    // 4) Decide if this client is the drawer, enable drawing only for drawer
    const myId = store.myId || store.mySocketId || socket.id;
    const amDrawer = myId === drawerId;
    console.log(
      `[socket] round_started - amDrawer? ${amDrawer} (myId=${myId} drawerId=${drawerId})`
    );

    // small delay to avoid UI race where overlay removal and enabling drawing overlap
    setTimeout(() => {
      store.setCanDraw?.(!!amDrawer);
    }, 30);

    // 5) If server sent wordMask / blanks, set them for guessers
    if (wordMask && Array.isArray(wordMask)) {
      store.setWordBlanks?.(wordMask);
      store.setCurrentWord?.(wordMask.join(""));
    }
  });

  // 5) timer tick
  reg("update_timer", ({ timeLeft } = {}) => {
    if (typeof timeLeft !== "undefined") store.setTimeLeft?.(timeLeft);
  });

  // 6) guesser word blanks (various payload shapes)
  reg("set_word_blanks", (payload) => {
    if (!payload) return;
    if (Array.isArray(payload)) {
      store.setWordBlanks?.(payload);
      store.setCurrentWord?.(payload.join(""));
    } else if (payload.blanks) {
      store.setWordBlanks?.(payload.blanks);
      store.setCurrentWord?.(payload.blanks.join(""));
    } else if (typeof payload.length === "number") {
      const blanks = Array(payload.length).fill("_");
      store.setWordBlanks?.(blanks);
      store.setCurrentWord?.(blanks.join(""));
    }
  });

  // 7) start_drawing -> sent only to drawer
  // payload may be { drawerId, word } or just { word }
  reg("start_drawing", (payload = {}) => {
    const { drawerId, word } = payload;

    // If server provides drawerId, ensure only the intended client is allowed to draw
    if (typeof drawerId !== "undefined") {
      if (store.myId !== drawerId) {
        // Not the drawer — ensure drawing is disabled
        store.setCanDraw?.(false);
        // Also make sure the chooser overlay is closed for non-drawers
        store.setIsChoosingWord?.(false);
        store.clearWordChoices?.();
        return;
      }
      // If we reach here, we are the drawer
      store.setCanDraw?.(true);
    } else {
      // Server didn't supply drawerId — assume this event is drawer-only (server should only emit to drawer)
      // We'll enable draw for this client (safe if server emitted only to drawer)
      store.setCanDraw?.(true);
    }

    // Set secret word locally for drawer if server provided it
    if (word) {
      if (store.setSecretWord) store.setSecretWord(word);
      else store.setSecretWordIfDrawer?.(drawerId, word);
      store.setCurrentWord?.(word);
    }

    // Close the selector for drawer
    store.setIsChoosingWord?.(false);
    store.clearWordChoices?.();
  });

  // 8) correct guess announcement
  reg("correct_guess", (payload) => {
    if (!payload) return;
    const { playerId, sender, points } = payload;
    store.handleCorrectGuess?.({ playerId, sender });
    if (points) store.setScore?.(playerId, points);
    store.addMessage?.({
      system: true,
      text: `${sender} guessed correctly! (+${points || 0})`,
    });
  });

  // 9) authoritative score sync
  reg("scores_update", (payload) => {
    const map = payload && payload.scores ? payload.scores : payload || {};
    store.mergeScoresToPlayers?.(map);
  });

  // 10) drawer award on round end
  reg("drawer_awarded", ({ drawerId, points } = {}) => {
    if (!drawerId) return;
    store.setScore?.(drawerId, points || 0);
    store.addMessage?.({
      system: true,
      text: `Drawer awarded ${points || 0} points.`,
    });
  });

  // 11) round ended
  reg("round_ended", (payload = {}) => {
    const { round } = payload;
    if (typeof round !== "undefined") store.setRound?.(round);
    store.addMessage?.({ system: true, text: `Round ${round} ended.` });
    store.resetForNewRound?.();
    // Drawing will be disabled by server for next round via start_drawing to the new drawer
    store.setCanDraw?.(false);
  });

  // 12) clear canvas
  reg("clear_canvas", () => {
    store.addMessage?.({ system: true, text: "Canvas cleared." });
  });

  // 13) game over
  reg("game_over", (payload = {}) => {
    store.mergeScoresToPlayers?.(payload.scores || {});
    store.setGameStarted?.(false);
    store.addMessage?.({ system: true, text: "Game over." });
    store.setCanDraw?.(false);
  });

  // 14) broadcast chat
  reg("chat_message", (msg) => {
    if (!msg) return;
    store.addMessage?.(msg);
  });

  // 15) optional failure
  reg("joined_room_failure", (payload) => {
    store.addMessage?.({
      system: true,
      text: payload?.reason || "Failed to join room.",
    });
  });
}

/**
 * cleanupSocket - removes all listeners added by initSocket().
 * Useful for hot reloading during development.
 */
export function cleanupSocket() {
  listeners.forEach(({ event, handler }) => socket.off(event, handler));
  listeners.length = 0;
  initialized = false;
}

export default socket;
