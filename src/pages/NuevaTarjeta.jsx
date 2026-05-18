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

// Prefijos de placa por uso
const PREFIJOS_USO = {
  'Particular':                  ['P', 'M'],
  'Comercial':                   ['C', 'T'],
  'Transporte Público':          ['A', 'U'],
  'Agrícola / Industrial':       ['TRC'],
  'Oficial':                     ['O', 'PNC'],
  'Diplomático':                 ['CD', 'CC', 'MI'],
}

// Mapeo desde descripcion del tipo_uso a prefijos
function getPrefijos(descripcion) {
    if (!descripcion) return []
  const d = descripcion.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos

  if (d.includes('diplomat') || d.includes('consular') || d.includes('mision') || d.includes('internacional')) return ['CD', 'CC', 'MI']
  if (d.includes('oficial'))   return ['O', 'PNC']
  if (d.includes('agr') || d.includes('industrial') || d.includes('construc')) return ['TRC']
  if (d.includes('publico') || d.includes('alquiler') || d.includes('urbano')) return ['A', 'U']
  if (d.includes('comercial')) return ['C', 'T']
  if (d.includes('particular')) return ['P', 'M']
  return ['P']
}

const DESCRIPCION_PREFIJO = {
  P:   'Automóviles, camionetas, SUVs de uso personal',
  M:   'Motocicletas, motonetas, cuadriciclos',
  C:   'Camiones, furgonetas, buses extraurbanos',
  T:   'Remolques, semirremolques, plataformas',
  A:   'Taxis rotulados y autorizados',
  U:   'Buses/microbuses transporte urbano',
  TRC: 'Tractores, excavadoras, maquinaria pesada',
  O:   'Ministerios, municipalidades, entidades autónomas',
  PNC: 'Autopatrullas y motos de la Policía Nacional Civil',
  CD:  'Vehículos de embajadores y diplomáticos',
  CC:  'Vehículos de consulados extranjeros',
  MI:  'Organismos internacionales (ONU, OEA, etc.)',
}

// Genera número de tarjeta: TC-YYYY-XXXX
async function generarNoTarjeta() {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('tarjeta_circulacion')
    .select('*', { count: 'exact', head: true })
  const siguiente = String((count ?? 0) + 1).padStart(4, '0')
  const candidato = `TC-${year}-${siguiente}`
  // Verificar unicidad
  const { data } = await supabase.from('tarjeta_circulacion').select('no_tarjeta').eq('no_tarjeta', candidato).maybeSingle()
  if (data) {
    // Si ya existe (raro), incrementar
    const sig2 = String((count ?? 0) + 2).padStart(4, '0')
    return `TC-${year}-${sig2}`
  }
  return candidato
}

// Genera placa: PREFIJO + 3 dígitos + 3 letras, verifica unicidad
async function generarPlaca(prefijo) {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let placa, existe = true, intentos = 0
  while (existe && intentos < 20) {
    const nums  = String(Math.floor(Math.random() * 900) + 100)
    const lets  = Array.from({ length: 3 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
    placa = `${prefijo}${nums}${lets}`
    const { data } = await supabase.from('tarjeta_circulacion').select('placa').eq('placa', placa).maybeSingle()
    existe = !!data
    intentos++
  }
  return placa
}

export default function NuevaTarjeta() {
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [msg, setMsg]       = useState(null)
  const [usos, setUsos]     = useState([])

  const hoy  = new Date().toISOString().split('T')[0]
  const en2  = new Date(); en2.setFullYear(en2.getFullYear() + 2)
  const defValida = en2.toISOString().split('T')[0]

  const [form, setForm] = useState({
    no_tarjeta: '', placa: '', cui_propietario: '', vin_vehiculo: '',
    id_uso_fk: '', fecha_registro: hoy, fecha_valida: defValida,
    prefijo_placa: '',
  })

  const [infoProp, setInfoProp] = useState(null)
  const [infoVeh,  setInfoVeh]  = useState(null)
  const [buscando, setBuscando] = useState({ prop: false, veh: false })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    supabase.from('tipo_uso').select('id_uso, descripcion').order('descripcion')
      .then(({ data }) => setUsos(data ?? []))
  }, [])

  // Cuando cambia el uso, resetear prefijo y placa
  useEffect(() => {
    setForm(f => ({ ...f, prefijo_placa: '', placa: '', no_tarjeta: '' }))
  }, [form.id_uso_fk])

  const usoSeleccionado = usos.find(u => u.id_uso == form.id_uso_fk)
  const prefijos = getPrefijos(usoSeleccionado?.descripcion)

  async function generarDatos() {
    if (!form.id_uso_fk || !form.prefijo_placa) {
      setMsg({ type: 'err', text: 'Selecciona el tipo de uso y el prefijo de placa primero.' })
      return
    }
    setGenerando(true)
    setMsg(null)
    const [noTarjeta, placa] = await Promise.all([
      generarNoTarjeta(),
      generarPlaca(form.prefijo_placa),
    ])
    setForm(f => ({ ...f, no_tarjeta: noTarjeta, placa }))
    setGenerando(false)
  }

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

  const [vehError, setVehError] = useState(null)

  async function verificarVeh() {
    if (!form.vin_vehiculo) return
    setBuscando(b => ({ ...b, veh: true }))
    setVehError(null)

    // Buscar vehículo
    const { data: veh } = await supabase
      .from('vehiculo')
      .select('vin, cui, modelo, marca(nombre_marca), linea(nombre_linea), tipo_vehiculo(descripcion), color(descripcion_color)')
      .eq('vin', form.vin_vehiculo.trim())
      .maybeSingle()

    if (!veh) {
      setBuscando(b => ({ ...b, veh: false }))
      setInfoVeh(false)
      return
    }

    // Verificar que el CUI del vehículo coincida con el propietario ingresado
    if (form.cui_propietario && veh.cui !== form.cui_propietario.trim()) {
      setVehError('El CUI del propietario no coincide con el dueño registrado de este vehículo.')
      setInfoVeh(false)
      setBuscando(b => ({ ...b, veh: false }))
      return
    }

    // Verificar que no tenga ya una tarjeta activa
    const { data: tarjetaExistente } = await supabase
      .from('tarjeta_circulacion')
      .select('no_tarjeta, placa, id_estado_fk')
      .eq('vin_vehiculo', veh.vin)
      .eq('id_estado_fk', 1)
      .maybeSingle()

    if (tarjetaExistente) {
      setVehError(`Este vehículo ya tiene una tarjeta activa: ${tarjetaExistente.no_tarjeta} · Placa ${tarjetaExistente.placa}. Desactívala primero si deseas emitir una nueva.`)
      setInfoVeh(false)
      setBuscando(b => ({ ...b, veh: false }))
      return
    }

    setInfoVeh(veh)
    setBuscando(b => ({ ...b, veh: false }))
  }

  function irConfirmar() {
    if (!form.no_tarjeta || !form.placa) { setMsg({ type: 'err', text: 'Genera el número de tarjeta y placa primero.' }); return }
    const reqs = ['cui_propietario', 'vin_vehiculo', 'id_uso_fk', 'fecha_valida']
    if (reqs.some(k => !form[k])) { setMsg({ type: 'err', text: 'Completa todos los campos obligatorios.' }); return }
    if (!infoProp) { setMsg({ type: 'err', text: 'Verifica el CUI del propietario.' }); return }
    if (vehError)  { setMsg({ type: 'err', text: 'Corrige los errores del vehículo antes de continuar.' }); return }
    if (!infoVeh)  { setMsg({ type: 'err', text: 'Verifica el VIN del vehículo.' }); return }
    setMsg(null)
    setStep(2)
  }

  async function emitir() {
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.from('tarjeta_circulacion').insert({
      no_tarjeta:      form.no_tarjeta,
      placa:           form.placa,
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
      setMsg({ type: 'ok', text: `Tarjeta ${form.no_tarjeta} · Placa ${form.placa} emitida correctamente.` })
      const hoyNew = new Date().toISOString().split('T')[0]
      const en2New = new Date(); en2New.setFullYear(en2New.getFullYear() + 2)
      setForm({ no_tarjeta: '', placa: '', cui_propietario: '', vin_vehiculo: '', id_uso_fk: '', fecha_registro: hoyNew, fecha_valida: en2New.toISOString().split('T')[0], prefijo_placa: '' })
      setInfoProp(null); setInfoVeh(null)
      setStep(1)
    }
  }

  const formatFecha = (f) => {
    if (!f) return '—'
    const [y, m, d] = f.split('-')
    return `${d}/${m}/${y}`
  }

  const usoLabel = usoSeleccionado?.descripcion

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Nueva tarjeta de circulación</h2>
        <p className="text-[13px] text-navy-mid/70">Emisión de tarjeta para un vehículo registrado</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-6">
        {[['1','Datos de tarjeta'],['2','Confirmación']].map(([n, lbl], i) => (
          <div key={n} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
              style={{ background: step >= parseInt(n) ? '#0B1B32' : '#e5e7eb', color: step >= parseInt(n) ? 'white' : '#9ca3af' }}>
              {n}
            </div>
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
            {/* Tipo de uso y prefijo */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
                Tipo de uso y placa
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Tipo de uso" required>
                  <select className={inputCls} value={form.id_uso_fk} onChange={set('id_uso_fk')}>
                    <option value="">Seleccionar…</option>
                    {usos.map(u => <option key={u.id_uso} value={u.id_uso}>{u.descripcion}</option>)}
                  </select>
                </Field>
                <Field label="Prefijo de placa" required>
                  <select className={inputCls} value={form.prefijo_placa} onChange={set('prefijo_placa')} disabled={!form.id_uso_fk}>
                    <option value="">Seleccionar prefijo…</option>
                    {prefijos.map(p => <option key={p} value={p}>{p} — {DESCRIPCION_PREFIJO[p]}</option>)}
                  </select>
                </Field>
              </div>

              {/* Generación automática */}
              <div className="flex items-center gap-4">
                <button
                  onClick={generarDatos}
                  disabled={generando || !form.prefijo_placa}
                  className="px-5 py-2 rounded-lg text-[13px] font-medium text-white transition-colors"
                  style={{ background: (!form.prefijo_placa || generando) ? '#9aafbe' : '#C48CB3' }}
                >
                  {generando ? 'Generando…' : '⟳ Generar No. Tarjeta y Placa'}
                </button>
                {form.no_tarjeta && (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-navy-mid/50 uppercase tracking-wide">No. Tarjeta</span>
                      <span className="text-[13px] font-medium text-navy-deep">{form.no_tarjeta}</span>
                    </div>
                    <div className="w-px h-8 bg-navy-deep/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-navy-mid/50 uppercase tracking-wide">Placa</span>
                      <span
                        className="text-[13px] font-bold tracking-[2px] text-white px-2 py-0.5 rounded"
                        style={{ background: '#0B1B32' }}
                      >
                        {form.placa}
                      </span>
                    </div>
                    <button
                      onClick={generarDatos}
                      className="text-[11px] text-navy-mid/50 hover:text-rose-strong transition-colors underline"
                    >
                      Regenerar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de registro">
                <input className={inputCls} type="date" value={form.fecha_registro} onChange={set('fecha_registro')} />
              </Field>
              <Field label="Fecha de vigencia" required>
                <input className={inputCls} type="date" value={form.fecha_valida} onChange={set('fecha_valida')} />
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
              <div className="flex gap-3 items-end flex-wrap">
                <Field label="VIN del vehículo" required>
                  <input className={inputCls + ' w-64'} value={form.vin_vehiculo} onChange={e => { set('vin_vehiculo')(e); setVehError(null); setInfoVeh(null) }} placeholder="1HGBH41JXMN109186" />
                </Field>
                <button onClick={verificarVeh} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                  {buscando.veh ? '…' : 'Verificar'}
                </button>
                {infoVeh === false && !vehError && <span className="text-[12px] text-red-600 pb-2">Vehículo no encontrado</span>}
                {infoVeh && <span className="text-[12px] text-green-700 pb-2">✓ {infoVeh.marca?.nombre_marca} {infoVeh.linea?.nombre_linea} {infoVeh.modelo}</span>}
              </div>
              {vehError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[12px] text-red-700">
                  {vehError}
                </div>
              )}
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
              <InfoRow label="No. Tarjeta"    value={form.no_tarjeta} />
              <InfoRow label="Placa"          value={form.placa} />
              <InfoRow label="Fecha registro" value={formatFecha(form.fecha_registro)} />
              <InfoRow label="Fecha vigencia" value={formatFecha(form.fecha_valida)} />
              <InfoRow label="Tipo de uso"    value={usoLabel} />
              <InfoRow label="Estado inicial" value="Activa" />
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
            <button onClick={emitir} disabled={loading} className="px-6 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: loading ? '#9aafbe' : '#C48CB3' }}>
              {loading ? 'Emitiendo…' : '✓ Emitir tarjeta'}
            </button>
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors">
              ← Regresar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
