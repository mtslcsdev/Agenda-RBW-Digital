export default function StatCard({ label, value, sub, variant, valueStyle }) {
  return (
    <div className={`stat-card${variant ? ` ${variant}` : ''}`}>
      <div className="label">{label}</div>
      <div className="value" style={valueStyle}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}
