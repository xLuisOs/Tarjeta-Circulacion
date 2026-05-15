import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const inputCls = 'border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors'

const OPERACIONES = [
  { id: 'dueno',  label: 'Cambio de propietario' },
  { id: 'motor',  label: 'Cambio de motor' },
  { id: 'color',  label: 'Cambio de color' },
]

export default function Mantenimiento() {
  const [placa,    setPlaca]    = useState('')
  const [tarjeta,  setTarjeta]  = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [op,       setOp]       = useState('dueno')
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState(null)

  // Cambio de dueño
  const [nuevoCui, setNuevoCui]     = useState('')
  const [infoProp, setInfoProp]     = useState(null)
  const [buscProp, setBuscProp]     = useState(false)

  // Cambio de motor
  const [nuevoMotor, setNuevoMotor] = useState('')

  // Cambio de color
  const [colores,    setColores]    = useState([])
  const [nuevoColor, setNuevoColor] = useState('')

  useEffect(() => {
    supabase.from('color').select('id_color, descripcion_color').order('descripcion_color')
      .then(({ data }) => setColores(data ?? []))
  }, [])

  async function buscarTarjeta() {
    if (!placa.trim()) return
    setBuscando(true)
    setTarjeta(null)
    setMsg(null)
    const { data } = await supabase
      .from('tarjeta_circulacion')
      .select(`
        no_tarjeta, placa, fecha_valida,
        estado_tarjeta(descripcion_estado),
        propietario(cui, primer_nombre, primer_apellido),
        vehiculo(vin, numero_motor, id_color_fk, color(descripcion_color), marca(nombre_marca), linea(nombre_linea))
      `)
      .eq('placa', placa.trim().toUpperCase())
      .maybeSingle()
    setBuscando(false)
    if (!data) setMsg({ type: 'err', text: 'No se encontró tarjeta con esa placa.' })
    else setTarjeta(data)
  }

  async function buscarProp() {
    if (!nuevoCui.trim()) return
    setBuscProp(true)
    const { data } = await supabase.from('propietario').select('cui, primer_nombre, primer_apellido').eq('cui', nuevoCui.trim()).maybeSingle()
    setBuscProp(false)
    setInfoProp(data ?? false)
  }

  async function aplicarCambio() {
    if (!tarjeta) return
    setLoading(true)
    setMsg(null)
    let error = null

    if (op === 'dueno') {
      if (!infoProp) { setMsg({ type: 'err', text: 'Verifica el CUI del nuevo propietario.' }); setLoading(false); return }
      // Actualizar propietario en vehiculo y tarjeta
      const r1 = await supabase.from('vehiculo').update({ cui: nuevoCui.trim() }).eq('vin', tarjeta.vehiculo.vin)
      const r2 = await supabase.from('tarjeta_circulacion').update({ cui_propietario: nuevoCui.trim() }).eq('no_tarjeta', tarjeta.no_tarjeta)
      error = r1.error || r2.error
    }

    if (op === 'motor') {
      if (!nuevoMotor.trim()) { setMsg({ type: 'err', text: 'Ingresa el nuevo número de motor.' }); setLoading(false); return }
      const r = await supabase.from('vehiculo').update({ numero_motor: nuevoMotor.trim() }).eq('vin', tarjeta.vehiculo.vin)
      error = r.error
    }

    if (op === 'color') {
      if (!nuevoColor) { setMsg({ type: 'err', text: 'Selecciona el nuevo color.' }); setLoading(false); return }
      const r = await supabase.from('vehiculo').update({ id_color_fk: parseInt(nuevoColor) }).eq('vin', tarjeta.vehiculo.vin)
      error = r.error
    }

    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      setMsg({ type: 'ok', text: 'Cambio aplicado correctamente.' })
      setTarjeta(null); setPlaca(''); setNuevoCui(''); setNuevoMotor(''); setNuevoColor(''); setInfoProp(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Mantenimiento de tarjetas</h2>
        <p className="text-[13px] text-navy-mid/70">Cambio de propietario, motor o color de vehículo</p>
      </div>

      {/* Buscar tarjeta */}
      <div className="bg-white border border-navy-deep/10 rounded-xl p-5 mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Buscar tarjeta por placa</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={placa}
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
          {/* Info actual */}
          <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-deep/8 flex items-center gap-3" style={{ background: '#0B1B32' }}>
              <span className="font-serif text-[16px] text-white">Tarjeta {tarjeta.no_tarjeta}</span>
              <span
                className="text-white font-bold text-[12px] tracking-[2px] px-3 py-1 rounded"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid #83A6CE' }}
              >
                {tarjeta.placa}
              </span>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4 text-[13px]">
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Propietario actual</p>
                <p className="font-medium text-navy-deep">{tarjeta.propietario?.primer_nombre} {tarjeta.propietario?.primer_apellido}</p>
                <p className="text-navy-mid/60 text-[12px]">CUI: {tarjeta.propietario?.cui}</p>
              </div>
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Vehículo</p>
                <p className="font-medium text-navy-deep">{tarjeta.vehiculo?.marca?.nombre_marca} {tarjeta.vehiculo?.linea?.nombre_linea}</p>
                <p className="text-navy-mid/60 text-[12px]">Motor: {tarjeta.vehiculo?.numero_motor}</p>
              </div>
              <div>
                <p className="text-navy-mid/50 text-[11px] uppercase tracking-wide mb-1">Color actual</p>
                <p className="font-medium text-navy-deep">{tarjeta.vehiculo?.color?.descripcion_color}</p>
                <p className="text-navy-mid/60 text-[12px]">VIN: {tarjeta.vehiculo?.vin}</p>
              </div>
            </div>
          </div>

          {/* Seleccionar operación */}
          <div className="bg-white border border-navy-deep/10 rounded-xl p-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Tipo de cambio</p>
            <div className="flex gap-3 mb-5">
              {OPERACIONES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setOp(id); setMsg(null) }}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all border"
                  style={op === id
                    ? { background: '#0B1B32', color: 'white', borderColor: '#0B1B32' }
                    : { background: 'transparent', color: '#26415E', borderColor: 'rgba(11,27,50,0.15)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Cambio de dueño */}
            {op === 'dueno' && (
              <div className="flex gap-3 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">CUI del nuevo propietario</label>
                  <input className={inputCls} value={nuevoCui} onChange={e => setNuevoCui(e.target.value)} placeholder="CUI del nuevo dueño" />
                </div>
                <button onClick={buscarProp} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                  {buscProp ? '…' : 'Verificar'}
                </button>
                {infoProp === false && <span className="text-[12px] text-red-600 pb-2">No encontrado</span>}
                {infoProp && <span className="text-[12px] text-green-700 pb-2">✓ {infoProp.primer_nombre} {infoProp.primer_apellido}</span>}
              </div>
            )}

            {/* Cambio de motor */}
            {op === 'motor' && (
              <div className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">Nuevo número de motor</label>
                <input className={inputCls} value={nuevoMotor} onChange={e => setNuevoMotor(e.target.value)} placeholder="Ej: 2ZR-FE-099123" />
              </div>
            )}

            {/* Cambio de color */}
            {op === 'color' && (
              <div className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">Nuevo color</label>
                <select className={inputCls} value={nuevoColor} onChange={e => setNuevoColor(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {colores.map(c => <option key={c.id_color} value={c.id_color}>{c.descripcion_color}</option>)}
                </select>
              </div>
            )}

            {msg && (
              <div className={`mt-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.text}
              </div>
            )}

            <div className="mt-5">
              <button
                onClick={aplicarCambio}
                disabled={loading}
                className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
                style={{ background: loading ? '#9aafbe' : '#C48CB3' }}
              >
                {loading ? 'Aplicando…' : 'Aplicar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
