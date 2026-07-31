import { useState } from 'react'
import DashboardHome from './DashboardHome'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import ManagementSection from './ManagementSection'
import { type DashboardSection } from './dashboardData'

export default function DashboardLayout() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('Dashboard')

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <section className="lg:pl-72">
        <DashboardTopbar activeSection={activeSection} onSectionChange={setActiveSection} />

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          {activeSection === 'Dashboard' ? (
            <DashboardHome />
          ) : (
            <ManagementSection section={activeSection} />
          )}
        </section>
      </section>
    </main>
  )
}
