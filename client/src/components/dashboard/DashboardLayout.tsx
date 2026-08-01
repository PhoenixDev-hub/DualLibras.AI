import { useState } from 'react'
import DashboardHome from './DashboardHome'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import ManagementSection from './ManagementSection'
import { type DashboardSection } from './dashboardData'
import type { DashboardData, DashboardUser } from '../../services/authApi'

type DashboardLayoutProps = {
  user: DashboardUser
  dashboard: DashboardData
}

export default function DashboardLayout({ user, dashboard }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>(dashboard.access.sections[0] ?? 'Dashboard')

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar
        activeSection={activeSection}
        menuItems={dashboard.menuItems}
        user={user}
        onSectionChange={setActiveSection}
      />

      <section className="lg:pl-72">
        <DashboardTopbar
          activeSection={activeSection}
          menuItems={dashboard.menuItems}
          user={user}
          onSectionChange={setActiveSection}
        />

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          {activeSection === 'Dashboard' ? (
            <DashboardHome user={user} dashboard={dashboard} />
          ) : (
            <ManagementSection section={activeSection} dashboard={dashboard} />
          )}
        </section>
      </section>
    </main>
  )
}
