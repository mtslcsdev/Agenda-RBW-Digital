import { useRef, useEffect, useState, useCallback } from 'react'

const TOOLS = [
  { cmd: 'bold',          icon: 'B',   title: 'Negrito',        style: { fontWeight: 700 } },
  { cmd: 'italic',        icon: 'I',   title: 'Itálico',        style: { fontStyle: 'italic' } },
  { cmd: 'underline',     icon: 'U',   title: 'Sublinhado',     style: { textDecoration: 'underline' } },
  { sep: true },
  { cmd: 'h1',            icon: 'H1',  title: 'Título 1',       block: 'h1' },
  { cmd: 'h2',            icon: 'H2',  title: 'Título 2',       block: 'h2' },
  { cmd: 'h3',            icon: 'H3',  title: 'Título 3',       block: 'h3' },
  { sep: true },
  { cmd: 'insertUnorderedList',  icon: '≡',  title: 'Lista bullet' },
  { cmd: 'insertOrderedList',    icon: '1≡', title: 'Lista numerada' },
  { sep: true },
  { cmd: 'code',          icon: '</>',  title: 'Bloco de código', block: 'pre' },
  { cmd: 'quote',         icon: '❝',   title: 'Citação',        block: 'blockquote' },
  { sep: true },
  { cmd: 'divider',       icon: '—',   title: 'Divisor' },
  { cmd: 'createLink',    icon: '🔗',  title: 'Link' },
]

export default function RichEditor({ value, onChange, placeholder = 'Escreva aqui...' }) {
  const editorRef = useRef(null)
  const [active, setActive] = useState({})
  const initialized = useRef(false)

  // Mount: set initial content
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || ''
      initialized.current = true
    }
  }, [])

  // Track active formatting states
  const updateActive = useCallback(() => {
    setActive({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }, [])

  function exec(tool) {
    editorRef.current?.focus()
    if (tool.block) {
      document.execCommand('formatBlock', false, tool.block)
    } else if (tool.cmd === 'divider') {
      document.execCommand('insertHTML', false, '<hr/><p><br/></p>')
    } else if (tool.cmd === 'createLink') {
      const url = prompt('URL do link:')
      if (url) document.execCommand('createLink', false, url)
    } else {
      document.execCommand(tool.cmd, false, null)
    }
    handleChange()
    updateActive()
  }

  function handleChange() {
    const html = editorRef.current?.innerHTML || ''
    onChange(html)
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
    // Enter on heading → back to paragraph
    if (e.key === 'Enter') {
      const block = document.queryCommandValue('formatBlock')
      if (['h1','h2','h3'].includes(block)) {
        setTimeout(() => {
          document.execCommand('formatBlock', false, 'p')
        }, 0)
      }
    }
  }

  const isEmpty = !value || value === '' || value === '<br>'

  return (
    <div className="rich-editor-wrap">
      {/* Toolbar */}
      <div className="rich-toolbar">
        {TOOLS.map((tool, i) => {
          if (tool.sep) return <div key={i} className="rich-toolbar-sep" />
          return (
            <button
              key={tool.cmd}
              className={`rich-tool-btn${active[tool.cmd] ? ' active' : ''}`}
              title={tool.title}
              onMouseDown={e => { e.preventDefault(); exec(tool) }}
              style={tool.style}
            >
              {tool.icon}
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div className="rich-editor-area">
        {isEmpty && (
          <div className="rich-placeholder">{placeholder}</div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor-content"
          onInput={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActive}
          onMouseUp={updateActive}
          onFocus={updateActive}
        />
      </div>
    </div>
  )
}
