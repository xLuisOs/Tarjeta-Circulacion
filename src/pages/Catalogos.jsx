import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const CATALOGOS = [
  {
    key:    'marca',
    table:  'marca',
    label:  'Marcas',
    col:    'nombre_marca',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4M9 17V9m6 8V9m-6 0h6M9 9H5m4 0V5h6v4m0 0h4" />
      </svg>
    ),
  },
  {
    key:    'linea',
    table:  'linea',
    label:  'Líneas',
    col:    'nombre_linea',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    key:    'tipo_vehiculo',
    table:  'tipo_vehiculo',
    label:  'Tipos de vehículo',
    col:    'descripcion',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8zM5 17h14M8 17v4M16 17v4" />
      </svg>
    ),
  },
  {
    key:    'tipo_uso',
    table:  'tipo_uso',
    label:  'Tipos de uso',
    col:    'descripcion',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    key:    'estado_tarjeta',
    table:  'estado_tarjeta',
    label:  'Estados de tarjeta',
    col:    'descripcion_estado',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
      </svg>
    ),
  },
  {
    key:    'color',
    table:  'color',
    label:  'Colores',
    col:    'descripcion_color',
    icon: (
      <svg fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
      </svg>
    ),
  },
]

function CatalogCard({ label, icon, items, loading }) {
  return (
    <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-[#f7f4f8] border-b border-navy-deep/8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0B1B32' }}>
          {icon}
        </div>
        <h4 className="text-[13px] font-medium text-navy-deep flex-1">{label}</h4>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(196,140,179,0.15)', color: '#C48CB3' }}
        >
          {loading ? '…' : items.length}
        </span>
      </div>
      <div className="max-h-[180px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-[12px] text-navy-mid/40 py-6">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-[12px] text-navy-mid/40 py-6">Sin registros</p>
        ) : items.map((item, i) => (
          <div
            key={i}
            className="flex items-center px-4 py-2 border-b border-navy-deep/4 last:border-0 text-[12px] text-navy-deep"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky flex-shrink-0 mr-2.5" />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Catalogos() {
  const [data, setData]       = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const results = await Promise.all(
        CATALOGOS.map(async ({ table, col, key }) => {
          const { data: rows } = await supabase
            .from(table)
            .select(col)
            .order(col)
          return { key, items: (rows ?? []).map(r => r[col]) }
        })
      )
      const map = {}
      results.forEach(({ key, items }) => { map[key] = items })
      setData(map)
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Catálogos</h2>
        <p className="text-[13px] text-navy-mid/70">Datos de referencia del sistema — solo lectura</p>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {CATALOGOS.map(({ key, label, icon }) => (
          <CatalogCard
            key={key}
            label={label}
            icon={icon}
            items={data[key] ?? []}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
