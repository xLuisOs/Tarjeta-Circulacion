export default function Topbar({ title }) {
  return (
    <header className="bg-white border-b border-navy-deep/10 px-7 py-3.5 flex items-center justify-between flex-shrink-0">
      <h1 className="font-serif text-[19px] text-navy-deep">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#f7f4f8] border border-navy-deep/10 rounded-lg px-3.5 py-2 w-64">
          <svg className="w-3.5 h-3.5 text-navy-deep/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar placa, VIN, CUI..."
            className="bg-transparent text-[13px] text-navy-deep outline-none flex-1 placeholder:text-navy-deep/35"
          />
        </div>
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #C48CB3, #83A6CE)' }}
        >
          LU
        </div>
      </div>
    </header>
  )
}
