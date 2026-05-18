export default function Topbar({ title }) {
  return (
    <header className="bg-white border-b border-navy-deep/10 px-7 py-3.5 flex items-center justify-between flex-shrink-0">
      <h1 className="font-serif text-[19px] text-navy-deep">{title}</h1>
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #C48CB3, #83A6CE)' }}
      >
        LU
      </div>
    </header>
  )
}
