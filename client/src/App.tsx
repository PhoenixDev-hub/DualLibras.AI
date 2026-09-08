import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppPrincipal from './pages/AppPrincipal';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import RoomCode from './pages/RoomCode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPrincipal />} />
        <Route path="/aula" element={<AppPrincipal />} />
        <Route path="/codigo" element={<RoomCode />} />
        <Route path="/entrar" element={<Auth mode="login" />} />
        <Route path="/cadastrar" element={<Auth mode="cadastro" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
