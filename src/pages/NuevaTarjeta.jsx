import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const inputCls = 'border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors'

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">
        {label}{required && <span className="text-rose-strong ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 text-[13px]">
      <span className="text-navy-mid/60">{label}</span>
      <span className="font-medium text-navy-deep">{value ?? '—'}</span>
    </div>
  )
}

export default function NuevaTarjeta() {
  const [step, setStep]   = useState(1) // 1: datos, 2: confirmación
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const [usos, setUsos]       = useState([])

  const hoy = new Date().toISOString().split('T')[0]
  const en2  = new Date(); en2.setFullYear(en2.getFullYear() + 2)
  const defValida = en2.toISOString().split('T')[0]

  const [form, setForm] = useState({
    no_tarjeta: '', placa: '', cui_propietario: '', vin_vehiculo: '',
    id_uso_fk: '', fecha_registro: hoy, fecha_valida: defValida,
  })

  const [infoProp, setInfoProp]   = useState(null)
  const [infoVeh,  setInfoVeh]    = useState(null)
  const [buscando, setBuscando]   = useState({ prop: false, veh: false })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    supabase.from('tipo_uso').select('id_uso, descripcion').order('descripcion')
      .then(({ data }) => setUsos(data ?? []))
  }, [])

  async function verificarProp() {
    if (!form.cui_propietario) return
    setBuscando(b => ({ ...b, prop: true }))
    const { data } = await supabase
      .from('propietario')
      .select('cui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, nit')
      .eq('cui', form.cui_propietario.trim())
      .maybeSingle()
    setBuscando(b => ({ ...b, prop: false }))
    setInfoProp(data ?? false)
  }

  async function verificarVeh() {
    if (!form.vin_vehiculo) return
    setBuscando(b => ({ ...b, veh: true }))
    const { data } = await supabase
      .from('vehiculo')
      .select(`vin, modelo, marca(nombre_marca), linea(nombre_linea), tipo_vehiculo(descripcion), color(descripcion_color)`)
      .eq('vin', form.vin_vehiculo.trim())
      .maybeSingle()
    setBuscando(b => ({ ...b, veh: false }))
    setInfoVeh(data ?? false)
  }

  function irConfirmar() {
    const reqs = ['no_tarjeta','placa','cui_propietario','vin_vehiculo','id_uso_fk','fecha_valida']
    if (reqs.some(k => !form[k])) {
      setMsg({ type: 'err', text: 'Completa todos los campos obligatorios.' })
      return
    }
    if (!infoProp) { setMsg({ type: 'err', text: 'Verifica el CUI del propietario.' }); return }
    if (!infoVeh)  { setMsg({ type: 'err', text: 'Verifica el VIN del vehículo.' });   return }
    setMsg(null)
    setStep(2)
  }

  async function emitir() {
    setLoading(true)
    setMsg(null)
    // estado 1 = Activa (ajusta si tu id es diferente)
    const { error } = await supabase.from('tarjeta_circulacion').insert({
      no_tarjeta:      form.no_tarjeta,
      placa:           form.placa.toUpperCase(),
      fecha_registro:  form.fecha_registro,
      fecha_valida:    form.fecha_valida,
      id_uso_fk:       parseInt(form.id_uso_fk),
      id_estado_fk:    1,
      cui_propietario: form.cui_propietario,
      vin_vehiculo:    form.vin_vehiculo,
    })
    setLoading(false)
    if (error) {
      setMsg({ type: 'err', text: error.message })
      setStep(1)
    } else {
      setMsg({ type: 'ok', text: `Tarjeta ${form.no_tarjeta} emitida correctamente.` })
      setForm(f => ({ ...f, no_tarjeta: '', placa: '', cui_propietario: '', vin_vehiculo: '', id_uso_fk: '' }))
      setInfoProp(null); setInfoVeh(null)
      setStep(1)
    }
  }

  const usoLabel = usos.find(u => u.id_uso == form.id_uso_fk)?.descripcion

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Nueva tarjeta de circulación</h2>
        <p className="text-[13px] text-navy-mid/70">Emisión de tarjeta para un vehículo registrado</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[['1','Datos de tarjeta'],['2','Confirmación']].map(([n, lbl], i) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
              style={{
                background: step >= parseInt(n) ? '#0B1B32' : '#e5e7eb',
                color: step >= parseInt(n) ? 'white' : '#9ca3af',
              }}
            >{n}</div>
            <span className={`text-[13px] ${step >= parseInt(n) ? 'text-navy-deep font-medium' : 'text-navy-mid/40'}`}>{lbl}</span>
            {i === 0 && <div className="w-8 h-px bg-navy-deep/15 ml-1" />}
          </div>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {step === 1 && (
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8" style={{ background: '#0B1B32' }}>
            <h3 className="font-serif text-[16px] text-white">Datos de la tarjeta</h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Tarjeta */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. Tarjeta" required>
                <input className={inputCls} value={form.no_tarjeta} onChange={set('no_tarjeta')} placeholder="TC-2025-0001" />
              </Field>
              <Field label="Placa" required>
                <input className={inputCls} value={form.placa} onChange={set('placa')} placeholder="P 123 ABC" />
              </Field>
              <Field label="Fecha de registro">
                <input className={inputCls} type="date" value={form.fecha_registro} onChange={set('fecha_registro')} />
              </Field>
              <Field label="Fecha de vigencia" required>
                <input className={inputCls} type="date" value={form.fecha_valida} onChange={set('fecha_valida')} />
              </Field>
              <Field label="Tipo de uso" required>
                <select className={inputCls} value={form.id_uso_fk} onChange={set('id_uso_fk')}>
                  <option value="">Seleccionar…</option>
                  {usos.map(u => <option key={u.id_uso} value={u.id_uso}>{u.descripcion}</option>)}
                </select>
              </Field>
            </div>

            {/* Propietario */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
                Propietario
              </p>
              <div className="flex gap-3 items-end">
                <Field label="CUI del propietario" required>
                  <input className={inputCls + ' w-64'} value={form.cui_propietario} onChange={set('cui_propietario')} placeholder="2045678230101" />
                </Field>
                <button onClick={verificarProp} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                  {buscando.prop ? '…' : 'Verificar'}
                </button>
                {infoProp === false && <span className="text-[12px] text-red-600 pb-2">No encontrado</span>}
                {infoProp && <span className="text-[12px] text-green-700 pb-2">✓ {infoProp.primer_nombre} {infoProp.primer_apellido}</span>}
              </div>
            </div>

            {/* Vehículo */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
                Vehículo
              </p>
              <div className="flex gap-3 items-end">
                <Field label="VIN del vehículo" required>
                  <input className={inputCls + ' w-64'} value={form.vin_vehiculo} onChange={set('vin_vehiculo')} placeholder="1HGBH41JXMN109186" />
                </Field>
                <button onClick={verificarVeh} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                  {buscando.veh ? '…' : 'Verificar'}
                </button>
                {infoVeh === false && <span className="text-[12px] text-red-600 pb-2">No encontrado</span>}
                {infoVeh && <span className="text-[12px] text-green-700 pb-2">✓ {infoVeh.marca?.nombre_marca} {infoVeh.linea?.nombre_linea} {infoVeh.modelo}</span>}
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button onClick={irConfirmar} className="px-6 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#0B1B32' }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8" style={{ background: '#0B1B32' }}>
            <h3 className="font-serif text-[16px] text-white">Confirmar emisión</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Tarjeta</h4>
              <InfoRow label="No. Tarjeta"     value={form.no_tarjeta} />
              <InfoRow label="Placa"           value={form.placa.toUpperCase()} />
              <InfoRow label="Fecha registro"  value={form.fecha_registro} />
              <InfoRow label="Fecha vigencia"  value={form.fecha_valida} />
              <InfoRow label="Tipo de uso"     value={usoLabel} />
              <InfoRow label="Estado inicial"  value="Activa" />
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Propietario</h4>
              <InfoRow label="Nombre" value={`${infoProp?.primer_nombre} ${infoProp?.primer_apellido}`} />
              <InfoRow label="CUI"    value={infoProp?.cui} />
              <InfoRow label="NIT"    value={infoProp?.nit} />
              <h4 className="text-[10px] font-semibold uppercase tracking-[1px] mt-4 mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Vehículo</h4>
              <InfoRow label="VIN"    value={infoVeh?.vin} />
              <InfoRow label="Marca"  value={infoVeh?.marca?.nombre_marca} />
              <InfoRow label="Línea"  value={infoVeh?.linea?.nombre_linea} />
              <InfoRow label="Modelo" value={infoVeh?.modelo} />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={emitir}
              disabled={loading}
              className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
              style={{ background: loading ? '#9aafbe' : '#C48CB3' }}
            >
              {loading ? 'Emitiendo…' : '✓ Emitir tarjeta'}
            </button>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
            >
              ← Regresar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
