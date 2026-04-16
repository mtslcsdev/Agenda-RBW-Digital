import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Agenda-RBW-Digital/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — raramente muda, cache longo
          'react-vendor': ['react', 'react-dom'],
          // Roteamento
          'router': ['react-router-dom'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          // dnd-kit — usado só no Kanban
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    // Aumenta o limite do aviso de chunk (o DocEditor vai continuar grande — é esperado)
    chunkSizeWarningLimit: 600,
  },
})
