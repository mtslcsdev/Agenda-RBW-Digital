# 🚀 FlowDesk - RBW Digital

**Sistema Profissional de Gestão de Operações** estilo ClickUp/Monday para agências e equipes.

## ✨ Recursos Implementados

### MVP (Fase 1 ✅)
- ✅ **Autenticação Segura** - Supabase Auth com senhas criptografadas
- ✅ **Tema Dark/Light** - Design system completo com CSS variables
- ✅ **Dashboard Executivo** - KPIs, tarefas urgentes, clientes recentes
- ✅ **Gestão de Clientes CRUD** - Criar, editar, deletar, filtrar por status
- ✅ **Sistema de Tarefas CRUD** - Prioridade, status, cliente vinculado
- ✅ **Visão Kanban** - Drag & drop entre colunas de status
- ✅ **Relatório Financeiro** - Receita recorrente, clientes vencidos
- ✅ **Roteamento Completo** - React Router com deep links
- ✅ **Contextos + Hooks** - AuthContext, AppContext, useClients, useTasks
- ✅ **Sincronização Real-time** - WebSocket via Supabase para mudanças instantâneas
- ✅ **Interface Responsiva** - Mobile-first, desktop otimizado
- ✅ **Multi-usuário** - Autenticação + isolamento de dados

### Roadmap (Fase 2 🚀)
- 🔄 **Calendário** - Visões: hoje, semana, mês. Eventos: reuniões, calls, follow-ups
- 🔄 **Equipe** - Gestão de membros, roles, permissões por função
- 🔄 **Onboarding Automático** - Templates, checklists, histórico
- 🔄 **Comentários em Tempo Real** - Feedback em tarefas e clientes
- 🔄 **Upload de Arquivos** - Attachments via Supabase Storage
- 🔄 **Notificações** - Alerts de tarefas vencendo, clientes atrasados
- 🔄 **Busca Global** - Busca instantânea em clientes e tarefas
- 🔄 **Multi-tenant** - Suporte a múltiplos workspaces/empresas

## 🛠️ Stack Técnico

- **Frontend**: React 18 + Vite + React Router
- **State**: Context API + Custom Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Database**: PostgreSQL com RLS e índices
- **Styles**: CSS Variables + Responsive Design
- **Gráficos**: Recharts (pronto para integração)
- **Drag & Drop**: @hello-pangea/dnd (pronto para integração)
- **Deploy**: Netlify (CI/CD automático via GitHub)

## 📋 Como começar

### Pré-requisitos

- Node.js 18+
- Conta no Supabase (gratuita)

### 1. Instalação

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 3. Desenvolvimento Local

```bash
npm run dev
```

Abre automaticamente em `http://localhost:5173`

### 4. Build para Produção

```bash
npm run build
```

Gera pasta `dist/` pronta para deploy

## 📁 Estrutura do Projeto

```
flowdesk/
├── src/
│   ├── context/                 # React Context (State Management)
│   │   ├── AuthContext.jsx      # Session + User + Profile
│   │   └── AppContext.jsx       # Theme + Notifications + Search
│   ├── hooks/                   # Custom Hooks
│   │   ├── useClients.js        # CRUD para clientes
│   │   ├── useTasks.js          # CRUD para tarefas
│   │   ├── useEvents.js         # (placeholder)
│   │   └── useTeam.js           # (placeholder)
│   ├── components/
│   │   ├── ui/                  # Componentes reutilizáveis
│   │   │   ├── Modal.jsx        # Modal para forms
│   │   │   ├── Modal.css
│   │   ├── Sidebar.jsx          # Navegação principal
│   │   ├── Sidebar.css
│   │   ├── TopBar.jsx           # Header com busca
│   │   └── TopBar.css
│   ├── pages/                   # Páginas completas (rotas)
│   │   ├── Auth.jsx             # Login/Signup
│   │   ├── Dashboard.jsx        # Layout + roteamento
│   │   ├── DashboardHome.jsx    # Dashboard executivo
│   │   ├── Clients.jsx          # CRUD de clientes
│   │   ├── Tasks.jsx            # CRUD + Kanban de tarefas
│   │   ├── Calendar.jsx         # Calendário (placeholder)
│   │   ├── Team.jsx             # Equipe (placeholder)
│   │   ├── Finance.jsx          # Relatório financeiro
│   │   └── *.css                # Estilos por página
│   ├── lib/
│   │   └── supabase.js          # Client do Supabase
│   ├── styles/
│   │   └── globals.css          # Design system + CSS variables
│   ├── App.jsx                  # Router + Providers
│   └── main.jsx                 # Entry point
├── supabase_migrations.sql      # SQL para setup do banco
├── index.html                   # HTML template
├── vite.config.js               # Config do Vite
├── package.json
├── .env                         # Variáveis de ambiente (git-ignored)
├── .env.example                 # Template de .env
└── .gitignore
```

## 🔐 Segurança

**O que NÃO fazer:**
- ❌ Commitar `.env` com credenciais reais
- ❌ Compartilhar Secret Keys
- ❌ Usar senhas fracas no Supabase

**O que fazemos:**
- ✅ Senhas criptografadas pelo Supabase
- ✅ Row Level Security no banco
- ✅ Validação client + server-side
- ✅ JWT tokens seguros via Supabase Auth
- ✅ .env nunca é commitado (está em .gitignore)

## 👥 Multi-usuário

Cada membro da equipe pode:

1. **Criar Conta**
   - Email único
   - Senha segura
   - Perfil automático

2. **Acessar Dados Compartilhados**
   - Ver clientes e tarefas
   - Editar em tempo real
   - Sincronização automática

3. **Colaborar**
   - Atribuir tarefas
   - Adicionar clientes
   - Atualizações live (WebSocket)

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Arrastar pasta 'dist' para Netlify
```

### Railway / Render

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático a cada push

## 📝 Dados

### Estrutura do Banco

#### Clientes
```javascript
{
  id: UUID,
  name: string,
  email: string,
  description: string,
  color: string,
  status: 'active' | 'inactive',
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Tarefas
```javascript
{
  id: UUID,
  title: string,
  description: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  completed: boolean,
  completed_at: timestamp,
  due_date: date,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Perfis
```javascript
{
  id: UUID (FK do Auth),
  username: string,
  name: string,
  role: string,
  avatar_color: string,
  avatar_initial: string,
  created_at: timestamp
}
```

## 🐛 Troubleshooting

**Erro: "Failed to connect to Supabase"**
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo

**Erro: "User not found"**
- Verifique se o email está correto
- Confirme se a conta foi criada

**Tarefa não sincroniza**
- Abra DevTools (F12) e veja a aba Network
- Verifique se sua conexão com internet está ativa

## 📚 Referências

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)

## 📄 Licença

Privado - RBW Digital © 2026

## 💬 Support

Contato: mateuslucasdev@gmail.com

---

**Desenvolvido com ❤️ por Mateus para RBW Digital**
