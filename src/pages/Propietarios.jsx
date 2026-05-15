import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY = {
  cui: '', nit: '', primer_nombre: '', segundo_nombre: '',
  primer_apellido: '', segundo_apellido: '', telefono: '', correo: '',
}

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

const inputCls = 'border border-navy-deep/10 rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:border-rose-strong focus:bg-white transition-colors'

export default function Propietarios() {
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null) // { type: 'ok'|'err', text }
  const [busqueda, setBusqueda] = useState('')
  const [encontrado, setEncontrado] = useState(null)
  const [buscando, setBuscando]     = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    if (!form.cui || !form.primer_nombre || !form.primer_apellido || !form.nit) {
      setMsg({ type: 'err', text: 'CUI, NIT, primer nombre y primer apellido son obligatorios.' })
      return
    }
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.from('propietario').upsert(form, { onConflict: 'cui' })
    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      setMsg({ type: 'ok', text: `Propietario guardado correctamente.` })
      setForm(EMPTY)
    }
  }

  async function buscar() {
    if (!busqueda.trim()) return
    setBuscando(true)
    setEncontrado(null)
    const { data } = await supabase
      .from('propietario')
      .select('*')
      .eq('cui', busqueda.trim())
      .maybeSingle()
    setBuscando(false)
    if (data) setEncontrado(data)
    else setEncontrado(false)
  }

  function cargarParaEditar() {
    setForm(encontrado)
    setEncontrado(null)
    setBusqueda('')
    setMsg({ type: 'ok', text: 'Propietario cargado para edición. Modifica los campos y guarda.' })
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Propietarios</h2>
        <p className="text-[13px] text-navy-mid/70">Registro y edición de propietarios de vehículos</p>
      </div>

      {/* Buscar existente */}
      <div className="bg-white border border-navy-deep/10 rounded-xl p-5 mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-mid/50 mb-3">Buscar propietario por CUI</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Ej: 2045678230101"
            className={inputCls + ' flex-1'}
          />
          <button
            onClick={buscar}
            className="px-5 py-2 rounded-lg text-[13px] font-medium text-white"
            style={{ background: '#26415E' }}
          >
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {encontrado === false && (
          <p className="text-[12px] text-red-600 mt-2">No se encontró ningún propietario con ese CUI.</p>
        )}
        {encontrado && (
          <div className="mt-3 flex items-center justify-between bg-[#f7f4f8] rounded-lg px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-navy-deep">
                {encontrado.primer_nombre} {encontrado.segundo_nombre} {encontrado.primer_apellido} {encontrado.segundo_apellido}
              </p>
              <p className="text-[11px] text-navy-mid/60">CUI: {encontrado.cui} · NIT: {encontrado.nit}</p>
            </div>
            <button
              onClick={cargarParaEditar}
              className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-navy-deep/15 hover:bg-white transition-colors"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-deep/8 flex items-center justify-between" style={{ background: '#0B1B32' }}>
          <h3 className="font-serif text-[16px] text-white">
            {form.cui && encontrado !== null ? 'Editar propietario' : 'Nuevo propietario'}
          </h3>
          <span className="text-[11px] text-white/40">* campos obligatorios</span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label="CUI" required>
            <input className={inputCls} value={form.cui} onChange={set('cui')} placeholder="2045 67823 0101" />
          </Field>
          <Field label="NIT" required>
            <input className={inputCls} value={form.nit} onChange={set('nit')} placeholder="1234567-8" />
          </Field>
          <Field label="Primer nombre" required>
            <input className={inputCls} value={form.primer_nombre} onChange={set('primer_nombre')} placeholder="María" />
          </Field>
          <Field label="Segundo nombre">
            <input className={inputCls} value={form.segundo_nombre} onChange={set('segundo_nombre')} placeholder="Fernanda" />
          </Field>
          <Field label="Primer apellido" required>
            <input className={inputCls} value={form.primer_apellido} onChange={set('primer_apellido')} placeholder="García" />
          </Field>
          <Field label="Segundo apellido">
            <input className={inputCls} value={form.segundo_apellido} onChange={set('segundo_apellido')} placeholder="López" />
          </Field>
          <Field label="Teléfono">
            <input className={inputCls} value={form.telefono} onChange={set('telefono')} placeholder="+502 5555-1234" />
          </Field>
          <Field label="Correo electrónico">
            <input className={inputCls} type="email" value={form.correo} onChange={set('correo')} placeholder="correo@ejemplo.com" />
          </Field>
        </div>

        {msg && (
          <div className={`mx-5 mb-4 px-4 py-3 rounded-lg text-[13px] ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={guardar}
            disabled={loading}
            className="px-6 py-2 rounded-lg text-[13px] font-medium text-white transition-colors"
            style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
          >
            {loading ? 'Guardando…' : 'Guardar propietario'}
          </button>
          <button
            onClick={() => { setForm(EMPTY); setMsg(null) }}
            className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
