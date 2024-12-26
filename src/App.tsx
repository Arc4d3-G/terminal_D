import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route
        path='/verify'
        element={<Verify />}
      />
      <Route
        path='/'
        element={<TerminalD />}
      />
    </Routes>
  );
}

export default App;
