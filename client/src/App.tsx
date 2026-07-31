import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppPrincipal from './pages/AppPrincipal';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/entrar" element={<Auth mode="login" />} />
        <Route path="/cadastrar" element={<Auth mode="cadastro" />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/aula" element={<AppPrincipal />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
