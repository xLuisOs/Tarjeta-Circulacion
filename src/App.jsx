import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Consulta from './pages/Consulta.jsx'
import Catalogos from './pages/Catalogos.jsx'

const PAGES = {
  dashboard: { label: 'Dashboard',        Component: Dashboard },
  consulta:  { label: 'Consultar Tarjeta', Component: Consulta  },
  catalogos: { label: 'Catálogos',         Component: Catalogos },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const { label, Component } = PAGES[activePage]

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar title={label} />
        <main className="flex-1 p-7 overflow-y-auto">
          <Component />
        </main>
      </div>
    </div>
  )
}
