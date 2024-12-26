import './App.css';
import Verify from './pages/Verify';
import TerminalD from './pages/TerminalD';
import { Routes, Route } from 'react-router-dom';
console.log(import.meta.env.VITE_BACKEND_URL); // Should output the URL like 'https://dewaldbreed.co.za/api'
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
