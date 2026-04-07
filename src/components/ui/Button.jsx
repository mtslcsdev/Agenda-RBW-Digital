export default function Button({ children, variant = 'primary', onClick, style, type = 'button' }) {
  const cls = variant === 'icon' ? 'btn-icon' : `btn btn-${variant}`
  return (
    <button className={cls} onClick={onClick} style={style} type={type}>
      {children}
    </button>
  )
}
