import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

function InfoSection({ title, rows }) {
  return (
    <div>
      <h4
        className="text-[10px] font-semibold tracking-[1px] uppercase mb-3 pb-1.5 border-b"
        style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}
      >
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

const BADGE = {
  Activa:   'bg-green-100 text-green-800',
  Inactiva: 'bg-red-100 text-red-800',
  Vencida:  'bg-yellow-100 text-yellow-800',
}

export default function Consulta() {
  const [tipo,   setTipo]   = useState('placa')
  const [valor,  setValor]  = useState('')
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)
  const [loading, setLoading] = useState(false)

  async function buscar() {
    if (!valor.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const col = tipo === 'placa' ? 'placa' : tipo === 'tarjeta' ? 'no_tarjeta' : 'cui_propietario'

      const { data, error: err } = await supabase
        .from('tarjeta_circulacion')
        .select(`
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
        `)
        .eq(col, valor.trim().toUpperCase())
        .maybeSingle()

      if (err) throw err
      if (!data) setError('No se encontró ninguna tarjeta con ese criterio.')
      else setResult(data)
    } catch (e) {
      setError('Error al consultar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function limpiar() {
    setValor('')
    setResult(null)
    setError(null)
  }

  const estado = result?.estado_tarjeta?.descripcion_estado

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
              value={tipo}
              onChange={e => setTipo(e.target.value)}
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
              type="text"
              value={valor}
              onChange={e => setValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ej: P123ABC"
              className="border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-[13px] font-medium text-white transition-colors"
            style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            onClick={limpiar}
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

      {/* Resultado */}
      {result && (
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#0B1B32' }}>
            <h3 className="font-serif text-[17px] text-white">Tarjeta No. {result.no_tarjeta}</h3>
            <div className="flex items-center gap-3">
              {estado && (
                <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${BADGE[estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  {estado}
                </span>
              )}
              <span
                className="text-navy-deep font-bold text-[14px] tracking-[3px] px-4 py-1.5 rounded"
                style={{ background: 'white', border: '2px solid #83A6CE' }}
              >
                {result.placa}
              </span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <InfoSection
              title="Tarjeta de circulación"
              rows={[
                ['No. Tarjeta',    result.no_tarjeta],
                ['Placa',          result.placa],
                ['Fecha registro', result.fecha_registro],
                ['Fecha vigencia', result.fecha_valida],
                ['Tipo de uso',    result.tipo_uso?.descripcion],
                ['Estado',         result.estado_tarjeta?.descripcion_estado],
              ]}
            />
            <InfoSection
              title="Propietario"
              rows={[
                ['Nombre', [result.propietario?.primer_nombre, result.propietario?.segundo_nombre, result.propietario?.primer_apellido, result.propietario?.segundo_apellido].filter(Boolean).join(' ')],
                ['CUI',     result.propietario?.cui],
                ['NIT',     result.propietario?.nit],
                ['Teléfono',result.propietario?.telefono],
                ['Correo',  result.propietario?.correo],
              ]}
            />
            <InfoSection
              title="Vehículo"
              rows={[
                ['VIN',    result.vehiculo?.vin],
                ['Marca',  result.vehiculo?.marca?.nombre_marca],
                ['Línea',  result.vehiculo?.linea?.nombre_linea],
                ['Tipo',   result.vehiculo?.tipo_vehiculo?.descripcion],
                ['Modelo', result.vehiculo?.modelo],
                ['Color',  result.vehiculo?.color?.descripcion_color],
              ]}
            />
            <InfoSection
              title="Especificaciones técnicas"
              rows={[
                ['No. Motor',   result.vehiculo?.numero_motor],
                ['Asientos',    result.vehiculo?.asientos],
                ['Ejes',        result.vehiculo?.ejes],
                ['Cilindros',   result.vehiculo?.cilindros],
                ['Cilindrada',  result.vehiculo?.cc ? `${result.vehiculo.cc.toLocaleString()} cc` : null],
                ['Tonelaje',    result.vehiculo?.ton ? `${result.vehiculo.ton} ton` : null],
              ]}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !loading && (
        <div className="text-center py-16 text-navy-mid/40">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p className="text-[13px]">Ingresa una placa, número de tarjeta o CUI para consultar</p>
        </div>
      )}
    </div>
  )
}
