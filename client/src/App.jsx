import { Routes, Route } from "react-router-dom";
import Welcome from "./Welcome";
import Game from "./components/Game";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/game/:code" element={<Game />} />
    </Routes>
  );
}

export default App;
