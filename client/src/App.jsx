import Welcome from './Welcome';
import { Routes, Route } from 'react-router-dom';
import Room from './Room';
import Game from './Game';

function App() {
  return (
  <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/room" element={<Room />} />
      <Route path="/game/:roomCode" element={<Game />} />
    </Routes>
  );
}

export default App
