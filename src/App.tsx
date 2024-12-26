import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter basename='/terminalD'>
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
    </BrowserRouter>
  );
}

export default App;
