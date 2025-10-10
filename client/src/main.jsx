// client/src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// socket init + cleanup (initSocket attaches listeners; cleanupSocket removes them)
import socket, { initSocket, cleanupSocket } from "./socket";

// initialize socket listeners once at module load
initSocket();

// cleanup on page unload to avoid dangling listeners/sockets
window.addEventListener("beforeunload", () => {
  try {
    cleanupSocket();
    socket.disconnect();
  } catch (e) {
    /* ignore cleanup errors */
  }
});

// support Vite HMR cleanup if available
if (import.meta && import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupSocket();
    try {
      socket.disconnect();
    } catch (e) {}
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
