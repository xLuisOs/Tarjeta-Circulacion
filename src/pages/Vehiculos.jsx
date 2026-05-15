import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY = {
  vin: '', cui: '', numero_motor: '', modelo: '',
  asientos: '', ejes: '', cilindros: '', cc: '', ton: '0',
  id_marca_fk: '', id_tipo_fk: '', id_linea_fk: '', id_color_fk: '',
}

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

export default function Vehiculos() {
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const [cats, setCats]       = useState({ marcas: [], tipos: [], lineas: [], colores: [] })
  const [propietario, setPropietario] = useState(null)
  const [buscandoProp, setBuscandoProp] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    async function fetchCats() {
      const [
        { data: marcas },
        { data: tipos },
        { data: colores },
      ] = await Promise.all([
        supabase.from('marca').select('id_marca, nombre_marca').order('nombre_marca'),
        supabase.from('tipo_vehiculo').select('id_tipo, descripcion').order('descripcion'),
        supabase.from('color').select('id_color, descripcion_color').order('descripcion_color'),
      ])
      setCats(c => ({ ...c, marcas: marcas ?? [], tipos: tipos ?? [], colores: colores ?? [] }))
    }
    fetchCats()
  }, [])

  useEffect(() => {
    async function fetchLineas() {
      if (!form.id_marca_fk) { setCats(c => ({ ...c, lineas: [] })); return }
      const { data } = await supabase
        .from('linea')
        .select('id_linea, nombre_linea')
        .eq('id_marca_fk', form.id_marca_fk)
        .order('nombre_linea')
      setCats(c => ({ ...c, lineas: data ?? [] }))
      setForm(f => ({ ...f, id_linea_fk: '' }))
    }
    fetchLineas()
  }, [form.id_marca_fk])

  async function buscarPropietario() {
    if (!form.cui) return
    setBuscandoProp(true)
    const { data } = await supabase
      .from('propietario')
      .select('cui, primer_nombre, primer_apellido')
      .eq('cui', form.cui.trim())
      .maybeSingle()
    setBuscandoProp(false)
    setPropietario(data ?? false)
  }

  async function guardar() {
    const reqs = ['vin','cui','numero_motor','modelo','asientos','ejes','cilindros','cc','id_marca_fk','id_tipo_fk','id_linea_fk','id_color_fk']
    if (reqs.some(k => !form[k])) {
      setMsg({ type: 'err', text: 'Completa todos los campos obligatorios.' })
      return
    }
    if (!propietario) {
      setMsg({ type: 'err', text: 'Verifica que el CUI del propietario exista.' })
      return
    }
    setLoading(true)
    setMsg(null)
    const payload = {
      ...form,
      asientos: parseInt(form.asientos),
      ejes:     parseInt(form.ejes),
      cilindros: parseInt(form.cilindros),
      cc:        parseInt(form.cc),
      ton:       parseFloat(form.ton || '0'),
      id_marca_fk: parseInt(form.id_marca_fk),
      id_tipo_fk:  parseInt(form.id_tipo_fk),
      id_linea_fk: parseInt(form.id_linea_fk),
      id_color_fk: parseInt(form.id_color_fk),
    }
    const { error } = await supabase.from('vehiculo').upsert(payload, { onConflict: 'vin' })
    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      setMsg({ type: 'ok', text: 'Vehículo guardado correctamente.' })
      setForm(EMPTY)
      setPropietario(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-navy-deep mb-1">Vehículos</h2>
        <p className="text-[13px] text-navy-mid/70">Registro de vehículos vinculados a un propietario</p>
      </div>

      <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-deep/8" style={{ background: '#0B1B32' }}>
          <h3 className="font-serif text-[16px] text-white">Datos del vehículo</h3>
        </div>

        <div className="p-5 space-y-5">
          {/* Propietario */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
              Propietario
            </p>
            <div className="flex gap-3 items-end">
              <Field label="CUI del propietario" required>
                <input className={inputCls + ' w-64'} value={form.cui} onChange={set('cui')} placeholder="2045678230101" />
              </Field>
              <button
                onClick={buscarPropietario}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-white mb-0"
                style={{ background: '#26415E' }}
              >
                {buscandoProp ? '…' : 'Verificar'}
              </button>
              {propietario === false && (
                <span className="text-[12px] text-red-600 pb-2">CUI no encontrado</span>
              )}
              {propietario && (
                <span className="text-[12px] text-green-700 pb-2">
                  ✓ {propietario.primer_nombre} {propietario.primer_apellido}
                </span>
              )}
            </div>
          </div>

          {/* Identificación */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
              Identificación
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="VIN" required>
                <input className={inputCls} value={form.vin} onChange={set('vin')} placeholder="1HGBH41JXMN109186" />
              </Field>
              <Field label="Número de motor" required>
                <input className={inputCls} value={form.numero_motor} onChange={set('numero_motor')} placeholder="2ZR-FE-021934" />
              </Field>
              <Field label="Modelo (año)" required>
                <input className={inputCls} value={form.modelo} onChange={set('modelo')} placeholder="2022" maxLength={4} />
              </Field>
            </div>
          </div>

          {/* Clasificación */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
              Clasificación
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marca" required>
                <select className={inputCls} value={form.id_marca_fk} onChange={set('id_marca_fk')}>
                  <option value="">Seleccionar…</option>
                  {cats.marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>)}
                </select>
              </Field>
              <Field label="Línea" required>
                <select className={inputCls} value={form.id_linea_fk} onChange={set('id_linea_fk')} disabled={!form.id_marca_fk}>
                  <option value="">Seleccionar marca primero…</option>
                  {cats.lineas.map(l => <option key={l.id_linea} value={l.id_linea}>{l.nombre_linea}</option>)}
                </select>
              </Field>
              <Field label="Tipo de vehículo" required>
                <select className={inputCls} value={form.id_tipo_fk} onChange={set('id_tipo_fk')}>
                  <option value="">Seleccionar…</option>
                  {cats.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.descripcion}</option>)}
                </select>
              </Field>
              <Field label="Color" required>
                <select className={inputCls} value={form.id_color_fk} onChange={set('id_color_fk')}>
                  <option value="">Seleccionar…</option>
                  {cats.colores.map(c => <option key={c.id_color} value={c.id_color}>{c.descripcion_color}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Especificaciones */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>
              Especificaciones técnicas
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Asientos" required>
                <input className={inputCls} type="number" min={1} value={form.asientos} onChange={set('asientos')} placeholder="5" />
              </Field>
              <Field label="Ejes" required>
                <input className={inputCls} type="number" min={1} value={form.ejes} onChange={set('ejes')} placeholder="2" />
              </Field>
              <Field label="Cilindros" required>
                <input className={inputCls} type="number" min={1} value={form.cilindros} onChange={set('cilindros')} placeholder="4" />
              </Field>
              <Field label="Cilindrada (cc)" required>
                <input className={inputCls} type="number" min={1} value={form.cc} onChange={set('cc')} placeholder="1798" />
              </Field>
              <Field label="Tonelaje">
                <input className={inputCls} type="number" min={0} step={0.01} value={form.ton} onChange={set('ton')} placeholder="1.20" />
              </Field>
            </div>
          </div>
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
            className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
            style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
          >
            {loading ? 'Guardando…' : 'Guardar vehículo'}
          </button>
          <button
            onClick={() => { setForm(EMPTY); setMsg(null); setPropietario(null) }}
            className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
