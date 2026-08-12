import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppPrincipal from './pages/AppPrincipal';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPrincipal />} />
        <Route path="/aula" element={<AppPrincipal />} />
        <Route path="/entrar" element={<Navigate to="/app" replace />} />
        <Route path="/cadastrar" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
