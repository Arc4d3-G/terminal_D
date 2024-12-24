import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

function App() {
  // Change routing depending on wether terminalD is being developed individually or within myPortfolio
  const isRoutedFromPortfolio = useLocation().pathname.startsWith('/terminalD');

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
