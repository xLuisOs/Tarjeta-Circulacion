import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const formatFecha = (f) => {
  if (!f) return '—'
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

const BADGE = {
  Activa:   'bg-green-100 text-green-800',
  Inactiva: 'bg-red-100 text-red-800',
  Vencida:  'bg-yellow-100 text-yellow-800',
}

function InfoSection({ title, rows }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold tracking-[1px] uppercase mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
        {title}
      </h4>
      {rows.map(([key, val]) => (
        <div key={key} className="flex justify-between py-1.5 text-[13px]">
          <span className="text-navy-mid/60">{key}</span>
          <span className="font-medium text-navy-deep text-right max-w-[55%]">{val ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

function TarjetaCard({ t }) {
  const [expandido, setExpandido] = useState(false)
  const estado = t.estado_tarjeta?.descripcion_estado

  return (
    <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
      {/* Header siempre visible */}
      <button
        onClick={() => setExpandido(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#faf8fb] transition-colors"
        style={{ background: '#0B1B32' }}
      >
        <h3 className="font-serif text-[15px] text-white flex-1">Tarjeta {t.no_tarjeta}</h3>
        <span className="text-white font-bold text-[12px] tracking-[2px] px-3 py-1 rounded"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid #83A6CE' }}>
          {t.placa}
        </span>
        {estado && (
          <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${BADGE[estado] ?? 'bg-gray-100 text-gray-600'}`}>
            {estado}
          </span>
        )}
        <svg
          className="w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200"
          style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Detalle expandido */}
      {expandido && (
        <div className="p-5 grid grid-cols-2 gap-5">
          <InfoSection
            title="Tarjeta de circulación"
            rows={[
              ['No. Tarjeta',    t.no_tarjeta],
              ['Placa',          t.placa],
              ['Fecha registro', formatFecha(t.fecha_registro)],
              ['Fecha vigencia', formatFecha(t.fecha_valida)],
              ['Tipo de uso',    t.tipo_uso?.descripcion],
              ['Estado',         estado],
            ]}
          />
          <InfoSection
            title="Propietario"
            rows={[
              ['Nombre', [t.propietario?.primer_nombre, t.propietario?.segundo_nombre, t.propietario?.primer_apellido, t.propietario?.segundo_apellido].filter(Boolean).join(' ')],
              ['CUI',     t.propietario?.cui],
              ['NIT',     t.propietario?.nit],
              ['Teléfono',t.propietario?.telefono],
              ['Correo',  t.propietario?.correo],
            ]}
          />
          <InfoSection
            title="Vehículo"
            rows={[
              ['VIN',    t.vehiculo?.vin],
              ['Marca',  t.vehiculo?.marca?.nombre_marca],
              ['Línea',  t.vehiculo?.linea?.nombre_linea],
              ['Tipo',   t.vehiculo?.tipo_vehiculo?.descripcion],
              ['Modelo', t.vehiculo?.modelo],
              ['Color',  t.vehiculo?.color?.descripcion_color],
            ]}
          />
          <InfoSection
            title="Especificaciones técnicas"
            rows={[
              ['No. Motor',  t.vehiculo?.numero_motor],
              ['Asientos',   t.vehiculo?.asientos],
              ['Ejes',       t.vehiculo?.ejes],
              ['Cilindros',  t.vehiculo?.cilindros],
              ['Cilindrada', t.vehiculo?.cc ? `${t.vehiculo.cc.toLocaleString()} cc` : null],
              ['Tonelaje',   t.vehiculo?.ton ? `${t.vehiculo.ton} ton` : null],
            ]}
          />
        </div>
      )}
    </div>
  )
}

const SELECT_QUERY = `
  no_tarjeta, placa, fecha_registro, fecha_valida,
  tipo_uso      ( descripcion ),
  estado_tarjeta( descripcion_estado ),
  propietario   ( cui, nit, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo ),
  vehiculo      (
    vin, numero_motor, modelo, asientos, ejes, cilindros, cc, ton,
    marca         ( nombre_marca ),
    linea         ( nombre_linea ),
    tipo_vehiculo ( descripcion ),
    color         ( descripcion_color )
  )
`

export default function Consulta() {
  const [tipo,    setTipo]    = useState('placa')
  const [valor,   setValor]   = useState('')
  const [results, setResults] = useState(null)  // null = sin búsqueda, [] = sin resultados, [...] = resultados
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  async function buscar() {
    if (!valor.trim()) return
    setLoading(true); setError(null); setResults(null)

    try {
      let data, err

      if (tipo === 'placa') {
        const r = await supabase.from('tarjeta_circulacion').select(SELECT_QUERY)
          .eq('placa', valor.trim().toUpperCase()).maybeSingle()
        err = r.error
        data = r.data ? [r.data] : []
      } else if (tipo === 'tarjeta') {
        const r = await supabase.from('tarjeta_circulacion').select(SELECT_QUERY)
          .eq('no_tarjeta', valor.trim()).maybeSingle()
        err = r.error
        data = r.data ? [r.data] : []
      } else {
        // Por CUI — puede tener múltiples tarjetas
        const r = await supabase.from('tarjeta_circulacion').select(SELECT_QUERY)
          .eq('cui_propietario', valor.trim())
        err = r.error
        data = r.data ?? []
      }

      if (err) throw err
      setResults(data)
      if (data.length === 0) setError('No se encontró ninguna tarjeta con ese criterio.')
    } catch (e) {
      setError('Error al consultar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function limpiar() {
    setValor(''); setResults(null); setError(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Consultar tarjeta</h2>
        <p className="text-[13px] text-navy-mid/70">Busca por número de tarjeta, placa o CUI del propietario</p>
      </div>

      {/* Búsqueda */}
      <div className="bg-white border border-navy-deep/10 rounded-xl p-5 mb-5">
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">Buscar por</label>
            <select
              value={tipo} onChange={e => { setTipo(e.target.value); limpiar() }}
              className="border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong transition-colors"
            >
              <option value="placa">Placa</option>
              <option value="tarjeta">No. Tarjeta</option>
              <option value="cui">CUI Propietario</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">Valor</label>
            <input
              type="text" value={valor}
              onChange={e => setValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder={tipo === 'placa' ? 'Ej: P123ABC' : tipo === 'tarjeta' ? 'Ej: TC-2025-0001' : 'Ej: 2045678230101'}
              className="border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors"
            />
          </div>
          <button onClick={buscar} disabled={loading}
            className="px-5 py-2 rounded-lg text-[13px] font-medium text-white transition-colors"
            style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
          <button onClick={limpiar}
            className="px-5 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] text-red-700 mb-5">
          {error}
        </div>
      )}

      {/* Resultados */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          {results.length > 1 && (
            <p className="text-[13px] text-navy-mid/60">
              Se encontraron <strong>{results.length} tarjetas</strong> para este propietario. Haz clic en cada una para ver el detalle.
            </p>
          )}
          {results.map(t => <TarjetaCard key={t.no_tarjeta} t={t} />)}
        </div>
      )}

      {/* Empty state */}
      {results === null && !error && !loading && (
        <div className="text-center py-16 text-navy-mid/40">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-[13px]">Ingresa una placa, número de tarjeta o CUI para consultar</p>
        </div>
      )}
    </div>
  )
}
