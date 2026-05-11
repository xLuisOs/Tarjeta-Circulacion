const NAV = [
  {
    section: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        id: 'consulta',
        label: 'Consultar Tarjeta',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Catálogos',
    items: [
      {
        id: 'catalogos',
        label: 'Catálogos',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        ),
      },
    ],
  },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-[220px] min-h-screen flex flex-col flex-shrink-0" style={{ background: '#0B1B32' }}>
      {/* Brand */}
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
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
                    active
                      ? 'font-medium'
                      : 'text-white/55 hover:bg-white/7 hover:text-white/85'
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/6 text-center">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Bases de Datos I<br />URL
        </p>
      </div>
    </aside>
  )
}
