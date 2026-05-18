import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Consulta from './pages/Consulta.jsx'
import Catalogos from './pages/Catalogos.jsx'
import Propietarios from './pages/Propietarios.jsx'
import Vehiculos from './pages/Vehiculos.jsx'
import NuevaTarjeta from './pages/NuevaTarjeta.jsx'
import Mantenimiento from './pages/Mantenimiento.jsx'
import Desactivacion from './pages/Desactivacion.jsx'

const PAGES = {
  dashboard:     { label: 'Dashboard',                  Component: Dashboard     },
  consulta:      { label: 'Consultar Tarjeta',          Component: Consulta      },
  catalogos:     { label: 'Catálogos',                  Component: Catalogos     },
  propietarios:  { label: 'Propietarios',               Component: Propietarios  },
  vehiculos:     { label: 'Vehículos',                  Component: Vehiculos     },
  nueva:         { label: 'Nueva Tarjeta',              Component: NuevaTarjeta  },
  mantenimiento: { label: 'Mantenimiento de Tarjetas',  Component: Mantenimiento },
  desactivacion: { label: 'Desactivación de Tarjetas',  Component: Desactivacion },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const { label, Component } = PAGES[activePage]

  // Exponer navegación global para el dashboard
  useEffect(() => {
    window.__navegarA = setActivePage
    return () => { delete window.__navegarA }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fijo */}
      <div className="flex-shrink-0 h-screen sticky top-0">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
      </div>

      {/* Contenido con scroll */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Topbar title={label} />
        <main className="flex-1 p-7 overflow-y-auto">
          <Component />
        </main>
      </div>
    </div>
  )
}
