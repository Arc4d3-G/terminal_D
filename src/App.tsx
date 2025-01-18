import './App.css';
import TerminalD from './pages/TerminalD';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={<TerminalD />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
