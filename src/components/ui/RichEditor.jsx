import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'

export default function RichEditor({ value, onChange, placeholder = 'Escreva aqui...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync externo: atualiza o conteúdo quando `value` muda fora do editor
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    const url = prompt('URL do link:')
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const btn = (label, action, isActive, title, extraStyle) => (
    <button
      key={label}
      className={`rich-tool-btn${isActive ? ' active' : ''}`}
      title={title || label}
      onMouseDown={e => { e.preventDefault(); action() }}
      style={extraStyle}
    >
      {label}
    </button>
  )

  const sep = (key) => <div key={key} className="rich-toolbar-sep" />

  return (
    <div className="rich-editor-wrap">
      <div className="rich-toolbar">
        {btn('B', () => editor.chain().focus().toggleBold().run(),
          editor.isActive('bold'), 'Negrito', { fontWeight: 700 })}

        {btn('I', () => editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic'), 'Itálico', { fontStyle: 'italic' })}

        {btn('U', () => editor.chain().focus().toggleStrike().run(),
          editor.isActive('strike'), 'Tachado', { textDecoration: 'line-through' })}

        {sep('s1')}

        {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive('heading', { level: 1 }), 'Título 1')}

        {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 }), 'Título 2')}

        {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive('heading', { level: 3 }), 'Título 3')}

        {sep('s2')}

        {btn('≡', () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive('bulletList'), 'Lista bullet')}

        {btn('1≡', () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive('orderedList'), 'Lista numerada')}

        {sep('s3')}

        {btn('❝', () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive('blockquote'), 'Citação')}

        {btn('</>', () => editor.chain().focus().toggleCodeBlock().run(),
          editor.isActive('codeBlock'), 'Bloco de código')}

        {sep('s4')}

        {btn('🔗', setLink, editor.isActive('link'), 'Link')}
      </div>

      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  )
}
