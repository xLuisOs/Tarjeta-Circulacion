import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white border border-navy-deep/10 rounded-xl px-5 py-[18px] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 mb-2">{label}</p>
          <p className="font-serif text-[28px] text-navy-deep leading-none">{value}</p>
          {sub && <p className="text-[11px] text-navy-mid/50 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-navy-deep">{label}</span>
        <span className="font-medium text-navy-deep">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-deep/8">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

const ESTADO_COLORS = { Activa: '#22c55e', Inactiva: '#ef4444', Vencida: '#f59e0b' }

const formatFecha = (f) => {
  if (!f) return '—'
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

export default function Dashboard() {
  const [stats,    setStats]    = useState({ activas: '—', inactivas: '—', vehiculos: '—', propietarios: '—', porVencer: '—', total: '—' })
  const [recientes, setRecientes] = useState([])
  const [porEstado, setPorEstado] = useState([])
  const [porMarca,  setPorMarca]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          { count: total },
          { count: activas },
          { count: inactivas },
          { count: vehiculos },
          { count: propietarios },
          { data: tarjetasRecientes },
          { data: estadoRows },
          { data: marcaRows },
        ] = await Promise.all([
          supabase.from('tarjeta_circulacion').select('*', { count: 'exact', head: true }),
          supabase.from('tarjeta_circulacion').select('*', { count: 'exact', head: true }).eq('id_estado_fk', 1),
          supabase.from('tarjeta_circulacion').select('*', { count: 'exact', head: true }).eq('id_estado_fk', 2),
          supabase.from('vehiculo').select('*', { count: 'exact', head: true }),
          supabase.from('propietario').select('*', { count: 'exact', head: true }),
          supabase.from('tarjeta_circulacion').select(`
            no_tarjeta, placa, fecha_registro,
            estado_tarjeta(descripcion_estado),
            propietario(primer_nombre, primer_apellido)
          `).order('fecha_registro', { ascending: false }).limit(6),
          supabase.from('estado_tarjeta').select('id_estado, descripcion_estado'),
          supabase.from('marca').select('id_marca, nombre_marca').limit(6),
        ])

        const hoy   = new Date()
        const en30  = new Date(); en30.setDate(hoy.getDate() + 30)
        const { count: porVencer } = await supabase
          .from('tarjeta_circulacion')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_valida', hoy.toISOString().split('T')[0])
          .lte('fecha_valida', en30.toISOString().split('T')[0])

        setStats({ total: total ?? 0, activas: activas ?? 0, inactivas: inactivas ?? 0, vehiculos: vehiculos ?? 0, propietarios: propietarios ?? 0, porVencer: porVencer ?? 0 })
        setRecientes(tarjetasRecientes ?? [])

        // Por estado
        const estadoCounts = await Promise.all(
          (estadoRows ?? []).map(async (e) => {
            const { count } = await supabase
              .from('tarjeta_circulacion')
              .select('*', { count: 'exact', head: true })
              .eq('id_estado_fk', e.id_estado)
            return { label: e.descripcion_estado, value: count ?? 0 }
          })
        )
        setPorEstado(estadoCounts)

        // Por marca (top 5)
        const marcaCounts = await Promise.all(
          (marcaRows ?? []).map(async (m) => {
            const { count } = await supabase
              .from('vehiculo')
              .select('*', { count: 'exact', head: true })
              .eq('id_marca_fk', m.id_marca)
            return { label: m.nombre_marca, value: count ?? 0 }
          })
        )
        setPorMarca(marcaCounts.sort((a, b) => b.value - a.value).slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const maxMarca = Math.max(...porMarca.map(m => m.value), 1)
  const COLORS = ['#C48CB3', '#83A6CE', '#26415E', '#E5C9D7', '#0D1E4C']

  const estadoBadge = (desc) => {
    const map = { Activa: 'bg-green-100 text-green-800', Inactiva: 'bg-red-100 text-red-800', Vencida: 'bg-yellow-100 text-yellow-800' }
    return <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${map[desc] ?? 'bg-gray-100 text-gray-600'}`}>{desc}</span>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Dashboard</h2>
        <p className="text-[13px] text-navy-mid/70">Resumen general del sistema de tarjetas de circulación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard label="Tarjetas activas"      value={loading ? '…' : stats.activas}      sub="Vigentes al día de hoy"  color="#C48CB3"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>} />
        <StatCard label="Tarjetas inactivas"    value={loading ? '…' : stats.inactivas}    sub="Desactivadas"            color="#ef4444"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>} />
        <StatCard label="Por vencer"            value={loading ? '…' : stats.porVencer}    sub="Próximos 30 días"        color="#f59e0b"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
        <StatCard label="Total de tarjetas"     value={loading ? '…' : stats.total}        sub="En el sistema"           color="#26415E"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>} />
        <StatCard label="Vehículos registrados" value={loading ? '…' : stats.vehiculos}    sub="En base de datos"        color="#83A6CE"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/></svg>} />
        <StatCard label="Propietarios"          value={loading ? '…' : stats.propietarios} sub="Personas registradas"    color="#0D1E4C"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {/* Tarjetas por estado */}
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8">
            <h3 className="text-[14px] font-medium text-navy-deep">Tarjetas por estado</h3>
          </div>
          <div className="p-5">
            {loading ? <p className="text-[12px] text-navy-mid/40 text-center py-4">Cargando…</p> : (
              <>
                {/* Donut visual simple */}
                <div className="flex justify-center gap-4 mb-4">
                  {porEstado.map((e, i) => (
                    <div key={i} className="text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 font-serif text-[16px] font-bold"
                        style={{ background: (ESTADO_COLORS[e.label] ?? '#ccc') + '22', color: ESTADO_COLORS[e.label] ?? '#ccc' }}
                      >
                        {e.value}
                      </div>
                      <p className="text-[10px] text-navy-mid/60">{e.label}</p>
                    </div>
                  ))}
                </div>
                {porEstado.map((e, i) => (
                  <MiniBar key={i} label={e.label} value={e.value} max={stats.total} color={ESTADO_COLORS[e.label] ?? '#ccc'} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Vehículos por marca */}
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8">
            <h3 className="text-[14px] font-medium text-navy-deep">Vehículos por marca</h3>
          </div>
          <div className="p-5">
            {loading ? <p className="text-[12px] text-navy-mid/40 text-center py-4">Cargando…</p> : (
              porMarca.map((m, i) => (
                <MiniBar key={i} label={m.label} value={m.value} max={maxMarca} color={COLORS[i % COLORS.length]} />
              ))
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8">
            <h3 className="text-[14px] font-medium text-navy-deep">Accesos rápidos</h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Nueva tarjeta',       page: 'nueva',         color: '#C48CB3' },
              { label: 'Registrar propietario', page: 'propietarios', color: '#26415E' },
              { label: 'Registrar vehículo',   page: 'vehiculos',     color: '#83A6CE' },
              { label: 'Consultar tarjeta',    page: 'consulta',      color: '#0D1E4C' },
              { label: 'Mantenimiento',        page: 'mantenimiento', color: '#E5C9D7' },
            ].map(({ label, page, color }) => (
              <button
                key={page}
                onClick={() => window.__navegarA?.(page)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-navy-deep/8 hover:bg-[#f7f4f8] transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[13px] text-navy-deep">{label}</span>
                <svg className="w-3.5 h-3.5 text-navy-mid/30 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas tarjetas */}
      <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-deep/8">
          <h3 className="text-[14px] font-medium text-navy-deep">Últimas tarjetas registradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f7f4f8]">
                {['No. Tarjeta','Placa','Propietario','Fecha registro','Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 border-b border-navy-deep/8">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-mid/40">Cargando…</td></tr>
              ) : recientes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-mid/40">Sin registros</td></tr>
              ) : recientes.map((t) => (
                <tr key={t.no_tarjeta} className="border-b border-navy-deep/5 last:border-0 hover:bg-rose-soft/10">
                  <td className="px-4 py-3 font-medium text-navy-deep">{t.no_tarjeta}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-white text-[11px] font-bold tracking-[2px] px-2.5 py-1 rounded" style={{ background: '#0B1B32', border: '2px solid #26415E' }}>
                      {t.placa}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-deep">{t.propietario?.primer_nombre} {t.propietario?.primer_apellido}</td>
                  <td className="px-4 py-3 text-navy-mid/70">{formatFecha(t.fecha_registro)}</td>
                  <td className="px-4 py-3">{estadoBadge(t.estado_tarjeta?.descripcion_estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
