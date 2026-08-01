import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppPrincipal from './pages/AppPrincipal';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { authApi } from './services/authApi';

function LessonAccess() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    authApi.me()
      .then((user) => {
        if (active) setAllowed(Boolean(user.access.capabilities.startTranscription))
      })
      .catch(() => {
        if (active) setAllowed(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (allowed === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <span className="text-sm font-bold">Validando acesso...</span>
      </main>
    )
  }

  if (!allowed) {
    return <Navigate to="/app" replace />
  }

  return <AppPrincipal />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/entrar" element={<Auth mode="login" />} />
        <Route path="/cadastrar" element={<Auth mode="cadastro" />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/aula" element={<LessonAccess />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
