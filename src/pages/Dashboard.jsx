import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const STAT_COLORS = ['#C48CB3', '#26415E', '#83A6CE', '#E5C9D7']

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-navy-deep/10 rounded-xl px-5 py-[18px] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <p className="text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 mb-2">{label}</p>
      <p className="font-serif text-[26px] text-navy-deep leading-none">{value}</p>
      {sub && <p className="text-[11px] text-navy-mid/50 mt-1">{sub}</p>}
    </div>
  )
}

const ACTIVITY_COLORS = { rose: '#C48CB3', sky: '#83A6CE', navy: '#26415E' }

function ActivityDot({ color }) {
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: ACTIVITY_COLORS[color] }}
    />
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ activas: '—', vehiculos: '—', propietarios: '—', porVencer: '—' })
  const [recientes, setRecientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { count: activas },
          { count: vehiculos },
          { count: propietarios },
          { data: tarjetasRecientes },
        ] = await Promise.all([
          supabase.from('tarjeta_circulacion').select('*', { count: 'exact', head: true }).eq('id_estado_fk', 1),
          supabase.from('vehiculo').select('*', { count: 'exact', head: true }),
          supabase.from('propietario').select('*', { count: 'exact', head: true }),
          supabase
            .from('tarjeta_circulacion')
            .select(`
              no_tarjeta, placa, fecha_registro,
              estado_tarjeta ( descripcion_estado ),
              propietario ( primer_nombre, primer_apellido )
            `)
            .order('fecha_registro', { ascending: false })
            .limit(5),
        ])

        const hoy = new Date()
        const en30 = new Date()
        en30.setDate(hoy.getDate() + 30)
        const { count: porVencer } = await supabase
          .from('tarjeta_circulacion')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_valida', hoy.toISOString().split('T')[0])
          .lte('fecha_valida', en30.toISOString().split('T')[0])

        setStats({
          activas:      activas     ?? 0,
          vehiculos:    vehiculos   ?? 0,
          propietarios: propietarios ?? 0,
          porVencer:    porVencer   ?? 0,
        })
        setRecientes(tarjetasRecientes ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const estadoBadge = (desc) => {
    if (!desc) return null
    const map = {
      Activa:   'bg-green-100 text-green-800',
      Inactiva: 'bg-red-100 text-red-800',
      Vencida:  'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${map[desc] ?? 'bg-gray-100 text-gray-600'}`}>
        {desc}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Resumen general</h2>
        <p className="text-[13px] text-navy-mid/70">Estadísticas del sistema de tarjetas de circulación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <StatCard label="Tarjetas activas"      value={loading ? '…' : stats.activas}      sub="Vigentes al día de hoy"  color={STAT_COLORS[0]} />
        <StatCard label="Vehículos registrados" value={loading ? '…' : stats.vehiculos}    sub="En base de datos"        color={STAT_COLORS[1]} />
        <StatCard label="Propietarios"          value={loading ? '…' : stats.propietarios} sub="Personas registradas"    color={STAT_COLORS[2]} />
        <StatCard label="Por vencer"            value={loading ? '…' : stats.porVencer}    sub="Próximos 30 días"        color={STAT_COLORS[3]} />
      </div>

      {/* Two col */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Actividad reciente (estática de ejemplo) */}
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8 flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-navy-deep">Actividad reciente</h3>
            <span className="text-[11px] text-navy-mid/50">Hoy</span>
          </div>
          <div>
            {[
              { dot: 'rose', text: 'Nueva tarjeta emitida', placa: 'P-123ABC', time: '10:34' },
              { dot: 'sky',  text: 'Cambio de propietario', placa: 'O-456DEF', time: '09:12' },
              { dot: 'navy', text: 'Tarjeta desactivada',  placa: 'M-789GHI', time: '08:45' },
              { dot: 'rose', text: 'Nueva tarjeta emitida', placa: 'C-321XYZ', time: '08:20' },
              { dot: 'sky',  text: 'Consulta realizada',   placa: 'Q-654MNO', time: '07:55' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-navy-deep/5 last:border-0 text-[13px]">
                <ActivityDot color={a.dot} />
                <span className="flex-1 text-navy-deep">
                  {a.text} · <strong>{a.placa}</strong>
                </span>
                <span className="text-[11px] text-navy-mid/50">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas tarjetas */}
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8">
            <h3 className="text-[14px] font-medium text-navy-deep">Últimas tarjetas emitidas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f7f4f8]">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 border-b border-navy-deep/8">Placa</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 border-b border-navy-deep/8">Propietario</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-navy-mid/60 border-b border-navy-deep/8">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-navy-mid/40 text-[13px]">Cargando…</td></tr>
                ) : recientes.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-navy-mid/40 text-[13px]">Sin registros</td></tr>
                ) : recientes.map((t) => (
                  <tr key={t.no_tarjeta} className="border-b border-navy-deep/5 last:border-0 hover:bg-rose-soft/10">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-white text-[11px] font-bold tracking-[2px] px-2.5 py-1 rounded"
                        style={{ background: '#0B1B32', border: '2px solid #26415E' }}
                      >
                        {t.placa}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-deep">
                      {t.propietario?.primer_nombre} {t.propietario?.primer_apellido}
                    </td>
                    <td className="px-4 py-3">
                      {estadoBadge(t.estado_tarjeta?.descripcion_estado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
