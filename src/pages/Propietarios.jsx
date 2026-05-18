import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY = {
  cui: '', nit: '', primer_nombre: '', segundo_nombre: '',
  primer_apellido: '', segundo_apellido: '', telefono: '', correo: '',
}

function formatCUI(digits) {
  const d = digits.replace(/\D/g, '').slice(0, 13)
  if (d.length <= 4)  return d
  if (d.length <= 9)  return `${d.slice(0,4)} ${d.slice(4)}`
  return `${d.slice(0,4)} ${d.slice(4,9)} ${d.slice(9)}`
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-navy-mid/60">
        {label}{required && <span className="text-rose-strong ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  )
}

const inputCls = (err) =>
  `border rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:bg-white transition-colors ${
    err ? 'border-red-400 focus:border-red-400' : 'border-navy-deep/10 focus:border-rose-strong'
  }`

function PropietarioCard({ prop, onEditar }) {
  const [expandido, setExpandido] = useState(false)
  const nombre = [prop.primer_nombre, prop.segundo_nombre, prop.primer_apellido, prop.segundo_apellido].filter(Boolean).join(' ')

  return (
    <div className="border border-navy-deep/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandido(e => !e)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#f7f4f8] transition-colors text-left"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C48CB3, #83A6CE)' }}
        >
          {prop.primer_nombre?.[0]}{prop.primer_apellido?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-navy-deep truncate">{nombre}</p>
          <p className="text-[11px] text-navy-mid/55">CUI: {formatCUI(prop.cui)}</p>
        </div>
        <svg
          className="w-4 h-4 text-navy-mid/40 flex-shrink-0 transition-transform duration-200"
          style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {expandido && (
        <div className="border-t border-navy-deep/8 px-4 py-4 bg-white">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[['NIT', prop.nit], ['Teléfono', prop.telefono || '—'], ['Correo', prop.correo || '—']].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-wide text-navy-mid/50 mb-0.5">{k}</p>
                <p className="text-[13px] text-navy-deep break-all">{v}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onEditar(prop)}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: '#26415E' }}
          >
            Editar registro
          </button>
        </div>
      )}
    </div>
  )
}

export default function Propietarios() {
  const [vista,       setVista]       = useState('form')
  const [form,        setForm]        = useState(EMPTY)
  const [cuiDisplay,  setCuiDisplay]  = useState('')
  const [cuiOriginal, setCuiOriginal] = useState(null)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [msg,         setMsg]         = useState(null)
  const [busqueda,    setBusqueda]    = useState('')
  const [encontrado,  setEncontrado]  = useState(null)
  const [buscando,    setBuscando]    = useState(false)
  const [registros,   setRegistros]   = useState([])
  const [cargandoReg, setCargandoReg] = useState(false)

  async function cargarRegistros() {
    setCargandoReg(true)
    const { data } = await supabase.from('propietario').select('*').order('primer_apellido')
    setRegistros(data ?? [])
    setCargandoReg(false)
  }

  function toggleVista() {
    const nueva = vista === 'form' ? 'registros' : 'form'
    setVista(nueva)
    if (nueva === 'registros') cargarRegistros()
  }

  function handleCUI(e) {
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 13)
    setCuiDisplay(formatCUI(soloDigitos))
    setForm(f => ({ ...f, cui: soloDigitos }))
    if (soloDigitos.length > 0 && soloDigitos.length < 13)
      setErrors(er => ({ ...er, cui: 'El CUI debe tener exactamente 13 dígitos' }))
    else
      setErrors(er => ({ ...er, cui: null }))
  }

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: null }))
  }

  function validar() {
    const errs = {}
    if (!form.cui)               errs.cui = 'El CUI es obligatorio'
    else if (form.cui.length !== 13) errs.cui = 'El CUI debe tener exactamente 13 dígitos'
    if (!form.nit)               errs.nit = 'El NIT es obligatorio'
    if (!form.primer_nombre)     errs.primer_nombre = 'El primer nombre es obligatorio'
    if (!form.primer_apellido)   errs.primer_apellido = 'El primer apellido es obligatorio'
    return errs
  }

  async function guardar() {
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true); setMsg(null)

    const esEdicion = cuiOriginal !== null
    const cuiRef    = esEdicion ? cuiOriginal : '___never___'

    const [resCui, resNit, resTel, resCorreo] = await Promise.all([
      // En edición, no chequear su propio CUI
      esEdicion ? { data: null } : supabase.from('propietario').select('cui').eq('cui', form.cui).maybeSingle(),
      supabase.from('propietario').select('nit').eq('nit', form.nit).neq('cui', cuiRef).maybeSingle(),
      form.telefono ? supabase.from('propietario').select('telefono').eq('telefono', form.telefono).neq('cui', cuiRef).maybeSingle() : { data: null },
      form.correo   ? supabase.from('propietario').select('correo').eq('correo', form.correo).neq('cui', cuiRef).maybeSingle()     : { data: null },
    ])

    const dupErrors = {}
    if (resCui.data)    dupErrors.cui      = 'Ya existe un propietario con ese CUI'
    if (resNit.data)    dupErrors.nit      = 'Ya existe un propietario con ese NIT'
    if (resTel.data)    dupErrors.telefono = 'Ya existe un propietario con ese teléfono'
    if (resCorreo.data) dupErrors.correo   = 'Ya existe un propietario con ese correo'

    if (Object.keys(dupErrors).length > 0) { setErrors(dupErrors); setLoading(false); return }

    const { error } = esEdicion
      ? await supabase.from('propietario').update({ ...form, cui: cuiOriginal }).eq('cui', cuiOriginal)
      : await supabase.from('propietario').insert(form)

    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      const textoOk = esEdicion
        ? `Propietario ${form.primer_nombre} ${form.primer_apellido} actualizado correctamente.`
        : `Propietario ${form.primer_nombre} ${form.primer_apellido} registrado correctamente.`
      limpiar()
      setMsg({ type: 'ok', text: textoOk })
    }
  }

  function limpiar() {
    setForm(EMPTY); setCuiDisplay(''); setErrors({}); setCuiOriginal(null); setMsg(null)
  }

  function cargarParaEditar(prop) {
    setForm(prop)
    setCuiDisplay(formatCUI(prop.cui))
    setCuiOriginal(prop.cui)
    setErrors({}); setMsg(null)
    setVista('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function buscar() {
    if (!busqueda.trim()) return
    setBuscando(true); setEncontrado(null)
    const { data } = await supabase.from('propietario').select('*')
      .eq('cui', busqueda.trim().replace(/\D/g, '')).maybeSingle()
    setBuscando(false)
    setEncontrado(data ?? false)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-navy-deep mb-1">Propietarios</h2>
          <p className="text-[13px] text-navy-mid/70">Registro y edición de propietarios de vehículos</p>
        </div>
        <button
          onClick={toggleVista}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors border"
          style={vista === 'registros'
            ? { background: '#0B1B32', color: 'white', borderColor: '#0B1B32' }
            : { background: 'white', color: '#0B1B32', borderColor: 'rgba(11,27,50,0.15)' }
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
          </svg>
          {vista === 'registros' ? 'Nuevo registro' : 'Ver registros'}
        </button>
      </div>

      {/* REGISTROS */}
      {vista === 'registros' && (
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8 flex items-center justify-between" style={{ background: '#0B1B32' }}>
            <h3 className="font-serif text-[16px] text-white">Propietarios registrados</h3>
            <span className="text-[11px] text-white/40">{registros.length} registros</span>
          </div>
          <div className="p-3 space-y-2">
            {cargandoReg ? (
              <p className="text-center text-[13px] text-navy-mid/40 py-8">Cargando…</p>
            ) : registros.length === 0 ? (
              <p className="text-center text-[13px] text-navy-mid/40 py-8">Sin registros aún</p>
            ) : registros.map(p => (
              <PropietarioCard key={p.cui} prop={p} onEditar={cargarParaEditar} />
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      {vista === 'form' && (
        <>
          <div className="bg-white border border-navy-deep/10 rounded-xl p-5 mb-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Buscar propietario por CUI</p>
            <div className="flex gap-3">
              <input
                type="text" value={busqueda}
                onChange={e => setBusqueda(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: 2045678230101" maxLength={13}
                className={inputCls(false) + ' flex-1'}
              />
              <button onClick={buscar} className="px-5 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                {buscando ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
            {encontrado === false && <p className="text-[12px] text-red-600 mt-2">No se encontró ningún propietario con ese CUI.</p>}
            {encontrado && (
              <div className="mt-3">
                <PropietarioCard prop={encontrado} onEditar={cargarParaEditar} />
              </div>
            )}
          </div>

          <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-deep/8 flex items-center justify-between" style={{ background: '#0B1B32' }}>
              <h3 className="font-serif text-[16px] text-white">
                {cuiOriginal ? 'Editando propietario' : 'Nuevo propietario'}
              </h3>
              <div className="flex items-center gap-3">
                {cuiOriginal && (
                  <button onClick={limpiar} className="text-[11px] text-white/50 hover:text-white/80 underline">
                    Cancelar edición
                  </button>
                )}
                <span className="text-[11px] text-white/40">* campos obligatorios</span>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              <Field label="CUI" required error={errors.cui}>
                <input
                  className={inputCls(errors.cui)}
                  value={cuiDisplay} onChange={handleCUI}
                  placeholder="2045 67823 0101" inputMode="numeric"
                  disabled={!!cuiOriginal}
                  style={cuiOriginal ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
                {form.cui.length > 0 && !cuiOriginal && (
                  <span className={`text-[10px] mt-0.5 ${form.cui.length === 13 ? 'text-green-600' : 'text-navy-mid/40'}`}>
                    {form.cui.length}/13 dígitos
                  </span>
                )}
              </Field>
              <Field label="NIT" required error={errors.nit}>
                <input className={inputCls(errors.nit)} value={form.nit} onChange={set('nit')} placeholder="1234567-8" />
              </Field>
              <Field label="Primer nombre" required error={errors.primer_nombre}>
                <input className={inputCls(errors.primer_nombre)} value={form.primer_nombre} onChange={set('primer_nombre')} placeholder="María" />
              </Field>
              <Field label="Segundo nombre">
                <input className={inputCls(false)} value={form.segundo_nombre} onChange={set('segundo_nombre')} placeholder="Fernanda" />
              </Field>
              <Field label="Primer apellido" required error={errors.primer_apellido}>
                <input className={inputCls(errors.primer_apellido)} value={form.primer_apellido} onChange={set('primer_apellido')} placeholder="García" />
              </Field>
              <Field label="Segundo apellido">
                <input className={inputCls(false)} value={form.segundo_apellido} onChange={set('segundo_apellido')} placeholder="López" />
              </Field>
              <Field label="Teléfono" error={errors.telefono}>
                <input className={inputCls(errors.telefono)} value={form.telefono} onChange={set('telefono')} placeholder="5555-1234" />
              </Field>
              <Field label="Correo electrónico" error={errors.correo}>
                <input className={inputCls(errors.correo)} type="email" value={form.correo} onChange={set('correo')} placeholder="correo@ejemplo.com" />
              </Field>
            </div>

            {msg && (
              <div className={`mx-5 mb-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.text}
              </div>
            )}

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={guardar} disabled={loading}
                className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
                style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
              >
                {loading ? 'Guardando…' : cuiOriginal ? 'Actualizar propietario' : 'Guardar propietario'}
              </button>
              <button onClick={limpiar}
                className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
