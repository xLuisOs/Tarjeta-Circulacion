import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY = {
  vin: '', cui: '', numero_motor: '', modelo: '',
  asientos: '', ejes: '', cilindros: '', cc: '', ton: '0',
  id_marca_fk: '', id_tipo_fk: '', id_linea_fk: '', id_color_fk: '',
}

const inputCls = (err) =>
  `border rounded-lg px-3 py-2 text-[13px] text-navy-deep bg-[#f7f4f8] outline-none focus:bg-white transition-colors ${
    err ? 'border-red-400' : 'border-navy-deep/10 focus:border-rose-strong'
  }`

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

function VehiculoCard({ veh, onEditar }) {
  const [expandido, setExpandido] = useState(false)
  return (
    <div className="border border-navy-deep/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandido(e => !e)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#f7f4f8] transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0B1B32' }}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-navy-deep truncate">
            {veh.marca?.nombre_marca} {veh.linea?.nombre_linea} · {veh.modelo}
          </p>
          <p className="text-[11px] text-navy-mid/55">VIN: {veh.vin}</p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full mr-2" style={{ background: 'rgba(131,166,206,0.15)', color: '#26415E' }}>
          {veh.tipo_vehiculo?.descripcion}
        </span>
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
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              ['Color',      veh.color?.descripcion_color],
              ['Motor',      veh.numero_motor],
              ['Cilindrada', `${veh.cc?.toLocaleString()} cc`],
              ['Asientos',   veh.asientos],
              ['Ejes',       veh.ejes],
              ['Cilindros',  veh.cilindros],
              ['Tonelaje',   `${veh.ton} ton`],
              ['CUI dueño',  veh.cui],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-wide text-navy-mid/50 mb-0.5">{k}</p>
                <p className="text-[13px] text-navy-deep">{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onEditar(veh)}
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

export default function Vehiculos() {
  const [vista,       setVista]       = useState('form')
  const [form,        setForm]        = useState(EMPTY)
  const [vinOriginal, setVinOriginal] = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [msg,         setMsg]         = useState(null)
  const [errors,      setErrors]      = useState({})
  const [cats,        setCats]        = useState({ marcas: [], tipos: [], lineas: [], colores: [] })
  const [propietario, setPropietario] = useState(null)
  const [buscandoProp, setBuscandoProp] = useState(false)
  const [registros,   setRegistros]   = useState([])
  const [cargandoReg, setCargandoReg] = useState(false)

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: null }))
  }

  useEffect(() => {
    async function fetchCats() {
      const [{ data: marcas }, { data: tipos }, { data: colores }] = await Promise.all([
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
        .from('linea').select('id_linea, nombre_linea')
        .eq('id_marca_fk', form.id_marca_fk).order('nombre_linea')
      setCats(c => ({ ...c, lineas: data ?? [] }))
      if (!vinOriginal) setForm(f => ({ ...f, id_linea_fk: '' }))
    }
    fetchLineas()
  }, [form.id_marca_fk])

  async function cargarRegistros() {
    setCargandoReg(true)
    const { data } = await supabase
      .from('vehiculo')
      .select(`vin, cui, numero_motor, modelo, asientos, ejes, cilindros, cc, ton,
        id_marca_fk, id_tipo_fk, id_linea_fk, id_color_fk,
        marca(nombre_marca), linea(nombre_linea),
        tipo_vehiculo(descripcion), color(descripcion_color)`)
      .order('vin')
    setRegistros(data ?? [])
    setCargandoReg(false)
  }

  function toggleVista() {
    const nueva = vista === 'form' ? 'registros' : 'form'
    setVista(nueva)
    if (nueva === 'registros') cargarRegistros()
  }

  async function buscarPropietario() {
    if (!form.cui) return
    setBuscandoProp(true)
    const { data } = await supabase.from('propietario')
      .select('cui, primer_nombre, primer_apellido').eq('cui', form.cui.trim()).maybeSingle()
    setBuscandoProp(false)
    setPropietario(data ?? false)
  }

  function cargarParaEditar(veh) {
    setForm({
      vin:         veh.vin,
      cui:         veh.cui,
      numero_motor: veh.numero_motor,
      modelo:      veh.modelo,
      asientos:    String(veh.asientos),
      ejes:        String(veh.ejes),
      cilindros:   String(veh.cilindros),
      cc:          String(veh.cc),
      ton:         String(veh.ton),
      id_marca_fk: String(veh.id_marca_fk),
      id_tipo_fk:  String(veh.id_tipo_fk),
      id_linea_fk: String(veh.id_linea_fk),
      id_color_fk: String(veh.id_color_fk),
    })
    setVinOriginal(veh.vin)
    setPropietario({ cui: veh.cui, primer_nombre: '(verificado)', primer_apellido: '' })
    setErrors({}); setMsg(null)
    setVista('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limpiar() {
    setForm(EMPTY); setVinOriginal(null); setPropietario(null); setErrors({}); setMsg(null)
  }

  async function guardar() {
    const reqs = ['vin','cui','numero_motor','modelo','asientos','ejes','cilindros','cc','id_marca_fk','id_tipo_fk','id_linea_fk','id_color_fk']
    const errs = {}
    reqs.forEach(k => { if (!form[k]) errs[k] = 'Obligatorio' })
    if (Object.keys(errs).length > 0) { setErrors(errs); setMsg({ type: 'err', text: 'Completa todos los campos obligatorios.' }); return }
    if (!propietario) { setMsg({ type: 'err', text: 'Verifica el CUI del propietario.' }); return }

    setLoading(true); setMsg(null)

    // Verificar duplicados de VIN y número de motor
    if (!vinOriginal) {
      const [resVin, resMotor] = await Promise.all([
        supabase.from('vehiculo').select('vin').eq('vin', form.vin.trim()).maybeSingle(),
        supabase.from('vehiculo').select('numero_motor').eq('numero_motor', form.numero_motor.trim()).maybeSingle(),
      ])
      const dupErrs = {}
      if (resVin.data)   dupErrs.vin          = 'Ya existe un vehículo registrado con ese VIN'
      if (resMotor.data) dupErrs.numero_motor  = 'El número de motor ya está registrado en otro vehículo'
      if (Object.keys(dupErrs).length > 0) {
        setErrors(dupErrs)
        setMsg({ type: 'err', text: 'No se puede guardar: ' + Object.values(dupErrs).join('. ') })
        setLoading(false); return
      }
    } else {
      // En edición solo verificar motor si cambió
      const { data: motorExiste } = await supabase.from('vehiculo').select('numero_motor')
        .eq('numero_motor', form.numero_motor.trim()).neq('vin', vinOriginal).maybeSingle()
      if (motorExiste) {
        setErrors(e => ({ ...e, numero_motor: 'El número de motor ya está registrado en otro vehículo' }))
        setMsg({ type: 'err', text: 'El número de motor ya está registrado en otro vehículo.' })
        setLoading(false); return
      }
    }

    const payload = {
      ...form,
      asientos:    parseInt(form.asientos),
      ejes:        parseInt(form.ejes),
      cilindros:   parseInt(form.cilindros),
      cc:          parseInt(form.cc),
      ton:         parseFloat(form.ton || '0'),
      id_marca_fk: parseInt(form.id_marca_fk),
      id_tipo_fk:  parseInt(form.id_tipo_fk),
      id_linea_fk: parseInt(form.id_linea_fk),
      id_color_fk: parseInt(form.id_color_fk),
    }

    const { error } = vinOriginal
      ? await supabase.from('vehiculo').update(payload).eq('vin', vinOriginal)
      : await supabase.from('vehiculo').insert(payload)

    setLoading(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
       const textoOk = vinOriginal
        ? `Vehículo ${vinOriginal} actualizado correctamente.`
        : `Vehículo ${form.vin} registrado correctamente.`
      limpiar()
      setMsg({ type: 'ok', text: textoOk })
      
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-navy-deep mb-1">Vehículos</h2>
          <p className="text-[13px] text-navy-mid/70">Registro de vehículos vinculados a un propietario</p>
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
            <h3 className="font-serif text-[16px] text-white">Vehículos registrados</h3>
            <span className="text-[11px] text-white/40">{registros.length} registros</span>
          </div>
          <div className="p-3 space-y-2">
            {cargandoReg ? (
              <p className="text-center text-[13px] text-navy-mid/40 py-8">Cargando…</p>
            ) : registros.length === 0 ? (
              <p className="text-center text-[13px] text-navy-mid/40 py-8">Sin registros aún</p>
            ) : registros.map(v => (
              <VehiculoCard key={v.vin} veh={v} onEditar={cargarParaEditar} />
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      {vista === 'form' && (
        <div className="bg-white border border-navy-deep/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-deep/8 flex items-center justify-between" style={{ background: '#0B1B32' }}>
            <h3 className="font-serif text-[16px] text-white">{vinOriginal ? 'Editando vehículo' : 'Datos del vehículo'}</h3>
            {vinOriginal && (
              <button onClick={limpiar} className="text-[11px] text-white/50 hover:text-white/80 underline">
                Cancelar edición
              </button>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Propietario */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Propietario</p>
              <div className="flex gap-3 items-end">
                <Field label="CUI del propietario" required error={errors.cui}>
                  <input className={inputCls(errors.cui) + ' w-64'} value={form.cui} onChange={set('cui')}
                    placeholder="2045678230101" disabled={!!vinOriginal}
                    style={vinOriginal ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                </Field>
                {!vinOriginal && (
                  <button onClick={buscarPropietario} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#26415E' }}>
                    {buscandoProp ? '…' : 'Verificar'}
                  </button>
                )}
                {propietario === false && <span className="text-[12px] text-red-600 pb-2">CUI no encontrado</span>}
                {propietario && <span className="text-[12px] text-green-700 pb-2">✓ {propietario.primer_nombre} {propietario.primer_apellido}</span>}
              </div>
            </div>

            {/* Identificación */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Identificación</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="VIN" required error={errors.vin}>
                  <input className={inputCls(errors.vin)} value={form.vin} onChange={set('vin')}
                    placeholder="1HGBH41JXMN109186" disabled={!!vinOriginal}
                    style={vinOriginal ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                </Field>
                <Field label="Número de motor" required error={errors.numero_motor}>
                  <input className={inputCls(errors.numero_motor)} value={form.numero_motor} onChange={set('numero_motor')} placeholder="2ZR-FE-021934" />
                </Field>
                <Field label="Modelo (año)" required error={errors.modelo}>
                  <input className={inputCls(errors.modelo)} value={form.modelo} onChange={set('modelo')} placeholder="2022" maxLength={4} />
                </Field>
              </div>
            </div>

            {/* Clasificación */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Clasificación</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca" required error={errors.id_marca_fk}>
                  <select className={inputCls(errors.id_marca_fk)} value={form.id_marca_fk} onChange={set('id_marca_fk')}>
                    <option value="">Seleccionar…</option>
                    {cats.marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>)}
                  </select>
                </Field>
                <Field label="Línea" required error={errors.id_linea_fk}>
                  <select className={inputCls(errors.id_linea_fk)} value={form.id_linea_fk} onChange={set('id_linea_fk')} disabled={!form.id_marca_fk}>
                    <option value="">Seleccionar marca primero…</option>
                    {cats.lineas.map(l => <option key={l.id_linea} value={l.id_linea}>{l.nombre_linea}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de vehículo" required error={errors.id_tipo_fk}>
                  <select className={inputCls(errors.id_tipo_fk)} value={form.id_tipo_fk} onChange={set('id_tipo_fk')}>
                    <option value="">Seleccionar…</option>
                    {cats.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.descripcion}</option>)}
                  </select>
                </Field>
                <Field label="Color" required error={errors.id_color_fk}>
                  <select className={inputCls(errors.id_color_fk)} value={form.id_color_fk} onChange={set('id_color_fk')}>
                    <option value="">Seleccionar…</option>
                    {cats.colores.map(c => <option key={c.id_color} value={c.id_color}>{c.descripcion_color}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Especificaciones */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3 pb-1.5 border-b" style={{ color: '#C48CB3', borderColor: '#E5C9D7' }}>Especificaciones técnicas</p>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Asientos" required error={errors.asientos}>
                  <input className={inputCls(errors.asientos)} type="number" min={1} value={form.asientos} onChange={set('asientos')} placeholder="5" />
                </Field>
                <Field label="Ejes" required error={errors.ejes}>
                  <input className={inputCls(errors.ejes)} type="number" min={1} value={form.ejes} onChange={set('ejes')} placeholder="2" />
                </Field>
                <Field label="Cilindros" required error={errors.cilindros}>
                  <input className={inputCls(errors.cilindros)} type="number" min={1} value={form.cilindros} onChange={set('cilindros')} placeholder="4" />
                </Field>
                <Field label="Cilindrada (cc)" required error={errors.cc}>
                  <input className={inputCls(errors.cc)} type="number" min={1} value={form.cc} onChange={set('cc')} placeholder="1798" />
                </Field>
                <Field label="Tonelaje">
                  <input className={inputCls(false)} type="number" min={0} step={0.01} value={form.ton} onChange={set('ton')} placeholder="1.20" />
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
            <button onClick={guardar} disabled={loading}
              className="px-6 py-2 rounded-lg text-[13px] font-medium text-white"
              style={{ background: loading ? '#9aafbe' : '#0B1B32' }}
            >
              {loading ? 'Guardando…' : vinOriginal ? 'Actualizar vehículo' : 'Guardar vehículo'}
            </button>
            <button onClick={limpiar}
              className="px-6 py-2 rounded-lg text-[13px] font-medium text-navy-deep border border-navy-deep/10 hover:bg-[#f7f4f8] transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
