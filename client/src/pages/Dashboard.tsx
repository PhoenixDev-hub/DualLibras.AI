import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { authApi, type DashboardData, type DashboardUser } from '../services/authApi'

export default function Dashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [currentUser, dashboardData] = await Promise.all([
          authApi.me(),
          authApi.dashboard(),
        ])

        if (!active) return
        setUser(currentUser)
        setDashboard(dashboardData)
      } catch {
        if (active) setUnauthorized(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <span className="text-sm font-bold">Carregando dashboard...</span>
      </main>
    )
  }

  if (unauthorized || !user || !dashboard) {
    return <Navigate to="/entrar" replace />
  }

  return <DashboardLayout user={user} dashboard={dashboard} onDashboardChange={setDashboard} />
}
