import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
