import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
const AppPrincipal = lazy(() => import('./pages/AppPrincipal'))
import LandingPage from './pages/LandingPage'
import RequireSession from './features/auth/RequireSession'
const Auth = lazy(() => import('./pages/Auth'))
const RoomCode = lazy(() => import('./pages/RoomCode'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Demonstracao = lazy(() => import('./pages/Demonstracao'))

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <main className="p-10" role="status">
            Carregando…
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demonstracao" element={<Demonstracao />} />
          <Route path="/app" element={<RequireSession><AppPrincipal /></RequireSession>} />
          <Route path="/aula" element={<RequireSession><AppPrincipal /></RequireSession>} />
          <Route path="/codigo" element={<RoomCode />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/entrar" element={<Auth mode="login" />} />
          <Route path="/cadastrar" element={<Auth mode="cadastro" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
