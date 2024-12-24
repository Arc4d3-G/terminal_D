import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Change routing depending on wether terminalD is being developed individually or within myPortfolio
const isRoutedFromPortfolio =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/terminalD');

function App() {
  return isRoutedFromPortfolio ? (
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
  ) : (
    <BrowserRouter>
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
