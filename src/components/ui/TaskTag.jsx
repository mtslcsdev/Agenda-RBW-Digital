export default function TaskTag({ label, color = 'green' }) {
  return (
    <span className={`task-tag tag-${color}`}>{label}</span>
  )
}
