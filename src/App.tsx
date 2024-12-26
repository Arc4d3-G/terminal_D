import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
console.log(import.meta.env.VITE_BACKEND_URL);
function App() {
  return (
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
