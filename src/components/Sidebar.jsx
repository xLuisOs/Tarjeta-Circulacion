const NAV = [
  {
    section: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
      },
      {
        id: 'consulta',
        label: 'Consultar Tarjeta',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
      },
    ],
  },
  {
    section: 'Registro',
    items: [
      {
        id: 'propietarios',
        label: 'Propietarios',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
      },
      {
        id: 'vehiculos',
        label: 'Vehículos',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8zM5 17h14M8 17v4M16 17v4"/></svg>,
      },
      {
        id: 'nueva',
        label: 'Nueva Tarjeta',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h2M11 15h4"/></svg>,
      },
    ],
  },
  {
    section: 'Gestión',
    items: [
      {
        id: 'mantenimiento',
        label: 'Mantenimiento',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      },
      {
        id: 'desactivacion',
        label: 'Desactivación',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
      },
      {
        id: 'catalogos',
        label: 'Catálogos',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
      },
    ],
  },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-[220px] min-h-screen flex flex-col flex-shrink-0" style={{ background: '#0B1B32' }}>
      <div className="px-5 py-6 border-b border-white/8">
        <span
          className="inline-block text-white text-[9px] font-semibold tracking-[1.5px] uppercase px-2 py-1 rounded mb-2"
          style={{ background: '#C48CB3' }}
        >
          SAT · GT
        </span>
        <div className="font-serif text-base text-white leading-snug">
          Tarjeta de<br />
          <span style={{ color: '#E5C9D7' }}>Circulación</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[9px] font-semibold tracking-[1.5px] uppercase text-white/30 px-2 mb-1.5">
              {section}
            </p>
            {items.map(({ id, label, icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-all mb-0.5 ${
                    active ? 'font-medium' : 'text-white/55 hover:bg-white/7 hover:text-white/85'
                  }`}
                  style={active ? { background: 'rgba(196,140,179,0.18)', color: '#E5C9D7' } : {}}
                >
                  <span className={active ? 'opacity-100' : 'opacity-70'}>{icon}</span>
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/6 text-center">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Bases de Datos I<br />URL · Entrega Final
        </p>
      </div>
    </aside>
  )
}
