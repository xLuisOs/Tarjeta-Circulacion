import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const inputCls = 'border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors'

const MOTIVOS = [
  { id: 'impago',      label: 'Por impago',      desc: 'La tarjeta se desactiva por falta de pago de impuestos o multas.' },
  { id: 'vencimiento', label: 'Por vencimiento',  desc: 'La tarjeta ha superado su fecha de vigencia.' },
  { id: 'otro',        label: 'Otro motivo',      desc: 'Especifica el motivo manualmente.' },
]

const formatFecha = (f) => {
  if (!f) return '—'
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

export default function Desactivacion() {
  const [placa,       setPlaca]       = useState('')
  const [tarjeta,     setTarjeta]     = useState(null)
  const [buscando,    setBuscando]    = useState(false)
  const [motivo,      setMotivo]      = useState('impago')
  const [loading,     setLoading]     = useState(false)
  const [msg,         setMsg]         = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [accion,      setAccion]      = useState('desactivar') // 'desactivar' | 'reactivar'

  async function buscarTarjeta() {
    if (!placa.trim()) return
    setBuscando(true); setTarjeta(null); setMsg(null); setConfirmando(false)

    const { data } = await supabase
      .from('tarjeta_circulacion')
      .select(`
        no_tarjeta, placa, fecha_registro, fecha_valida,
        id_estado_fk,
        estado_tarjeta ( id_estado, descripcion_estado ),
        propietario ( primer_nombre, primer_apellido, cui ),
        vehiculo ( marca(nombre_marca), linea(nombre_linea), modelo )
      `)
      .eq('placa', placa.trim().toUpperCase())
      .maybeSingle()

    setBuscando(false)
    if (!data) setMsg({ type: 'err', text: 'No se encontró tarjeta con esa placa.' })
    else {
      setTarjeta(data)
      const desc = data.estado_tarjeta?.descripcion_estado
      setAccion(desc === 'Activa' ? 'desactivar' : 'reactivar')
    }
  }

  async function cambiarEstado() {
    setLoading(true); setMsg(null)
    // id 1 = Activa, id 2 = Inactiva
    const nuevoEstado = accion === 'desactivar' ? 2 : 1
    const { error } = await supabase
      .from('tarjeta_circulacion')
      .update({ id_estado_fk: nuevoEstado })
      .eq('no_tarjeta', tarjeta.no_tarjeta)

    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      const textoOk = accion === 'desactivar'
        ? `Tarjeta ${tarjeta.no_tarjeta} desactivada correctamente.`
        : `Tarjeta ${tarjeta.no_tarjeta} reactivada correctamente.`
      setMsg({ type: 'ok', text: textoOk })
      setTarjeta(null); setPlaca(''); setConfirmando(false)
    }
  }

  const estado     = tarjeta?.estado_tarjeta?.descripcion_estado
  const esActiva   = estado === 'Activa'
  const motivoDesc = MOTIVOS.find(m => m.id === motivo)

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Gestión de estado de tarjetas</h2>
        <p className="text-[13px] text-navy-mid/70">Desactiva o reactiva tarjetas de circulación</p>
      </div>

      {/* Buscar */}
      <div className="bg-white border border-navy-deep/10 rounded-xl p-5 mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Buscar tarjeta por placa</p>
        <div className="flex gap-3">
          <input
            type="text" value={placa}
            onChange={e => setPlaca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarTarjeta()}
            placeholder="Ej: P123ABC"
            className={inputCls + ' flex-1'}
          />
          <button onClick={buscarTarjeta} className="px-5 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      {msg && !tarjeta && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {tarjeta && (
        <div className="space-y-4">
          {/* Info tarjeta */}
          <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#0B1B32' }}>
              <h3 className="font-serif text-[16px] text-white flex-1">Tarjeta {tarjeta.no_tarjeta}</h3>
              <span className="text-white font-bold text-[12px] tracking-[2px] px-3 py-1 rounded"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid #83A6CE' }}>
                {tarjeta.placa}
              </span>
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${esActiva ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {estado}
              </span>
            </div>
            <div className="p-5 grid grid-cols-4 gap-4 text-[13px]">
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Propietario</p>
                <p className="font-medium text-navy-deep">{tarjeta.propietario?.primer_nombre} {tarjeta.propietario?.primer_apellido}</p>
                <p className="text-navy-mid/60 text-[12px]">CUI: {tarjeta.propietario?.cui}</p>
              </div>
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Vehículo</p>
                <p className="font-medium text-navy-deep">{tarjeta.vehiculo?.marca?.nombre_marca} {tarjeta.vehiculo?.linea?.nombre_linea}</p>
                <p className="text-navy-mid/60 text-[12px]">Modelo: {tarjeta.vehiculo?.modelo}</p>
              </div>
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Registro</p>
                <p className="font-medium text-navy-deep">{formatFecha(tarjeta.fecha_registro)}</p>
              </div>
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Vigencia</p>
                <p className="font-medium text-navy-deep">{formatFecha(tarjeta.fecha_valida)}</p>
              </div>
            </div>
          </div>

          {/* Panel de acción */}
          <div className="bg-white border border-navy-deep/10 rounded-xl p-5">
            {/* Tabs desactivar / reactivar */}
            <div className="flex gap-2 mb-5">
              {[
                { id: 'desactivar', label: 'Desactivar',  color: '#b91c1c', disabled: !esActiva },
                { id: 'reactivar',  label: 'Reactivar',   color: '#15803d', disabled: esActiva  },
              ].map(({ id, label, color, disabled }) => (
                <button
                  key={id}
                  onClick={() => { if (!disabled) { setAccion(id); setConfirmando(false) } }}
                  disabled={disabled}
                  className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all border"
                  style={accion === id && !disabled
                    ? { background: color, color: 'white', borderColor: color }
                    : disabled
                      ? { background: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb', cursor: 'not-allowed' }
                      : { background: 'transparent', color: '#26415E', borderColor: 'rgba(11,27,50,0.15)' }
                  }
                >
                  {label}
                  {disabled && <span className="ml-1.5 text-[10px] opacity-60">(ya {id === 'desactivar' ? 'inactiva' : 'activa'})</span>}
                </button>
              ))}
            </div>

            {/* Motivo solo para desactivar */}
            {accion === 'desactivar' && (
              <div className="space-y-2 mb-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Motivo de desactivación</p>
                {MOTIVOS.map(m => (
                  <label
                    key={m.id}
                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={motivo === m.id
                      ? { borderColor: '#C48CB3', background: 'rgba(196,140,179,0.06)' }
                      : { borderColor: 'rgba(11,27,50,0.1)' }
                    }
                  >
                    <input type="radio" name="motivo" value={m.id} checked={motivo === m.id} onChange={() => setMotivo(m.id)} className="mt-0.5" />
                    <div>
                      <p className="text-[13px] font-medium text-navy-deep">{m.label}</p>
                      <p className="text-[12px] text-navy-mid/60">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {accion === 'reactivar' && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-[13px] text-green-800">
                  Al reactivar la tarjeta, su estado volverá a <strong>Activa</strong>. Asegúrate de que el propietario ha regularizado su situación.
                </p>
              </div>
            )}

            {msg && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-800'}`}>
                {msg.text}
              </div>
            )}

            {!confirmando ? (
              <button
                onClick={() => setConfirmando(true)}
                className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
                style={{ background: accion === 'desactivar' ? '#b91c1c' : '#15803d' }}
              >
                {accion === 'desactivar' ? 'Desactivar tarjeta' : 'Reactivar tarjeta'}
              </button>
            ) : (
              <div className={`border rounded-xl p-4 ${accion === 'desactivar' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-[13px] font-medium mb-1 ${accion === 'desactivar' ? 'text-red-800' : 'text-green-800'}`}>
                  ¿Estás seguro?
                </p>
                <p className={`text-[12px] mb-4 ${accion === 'desactivar' ? 'text-red-700' : 'text-green-700'}`}>
                  {accion === 'desactivar'
                    ? `Vas a desactivar la tarjeta ${tarjeta.no_tarjeta} (${tarjeta.placa}) por: ${motivoDesc?.label}.`
                    : `Vas a reactivar la tarjeta ${tarjeta.no_tarjeta} (${tarjeta.placa}).`
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cambiarEstado} disabled={loading}
                    className="px-5 py-2 rounded-lg text-[13px] font-medium text-white"
                    style={{ background: loading ? '#9aafbe' : accion === 'desactivar' ? '#b91c1c' : '#15803d' }}
                  >
                    {loading ? 'Procesando…' : `Sí, ${accion === 'desactivar' ? 'desactivar' : 'reactivar'}`}
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    className="px-5 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
