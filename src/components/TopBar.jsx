import { useState } from 'react'
import styles from './TopBar.module.css'

export function TopBar({ title }) {
  const [search, setSearch] = useState('')

  return (
    <div className={styles.topbar}>
      <h2>{title}</h2>
      <input
        type="text"
        placeholder="🔍 Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.search}
      />
    </div>
  )
}
