# 🏗️ FlowDesk - Arquitetura

## Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USUARIO FINAL                              │
│                   (Browser - Qualquer dispositivo)                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTP/HTTPS (HTTPS)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ App.jsx (Componente Principal)                              │  │
│  │  ├─ Auth Page (Login/Signup)                               │  │
│  │  │  └─ Supabase Auth Client                                │  │
│  │  └─ Dashboard Page                                          │  │
│  │     ├─ Sidebar (Navegação)                                 │  │
│  │     ├─ TopBar (Busca)                                      │  │
│  │     └─ Páginas:                                            │  │
│  │        ├─ Dashboard (Home)                                 │  │
│  │        ├─ Clients (ClientList)                             │  │
│  │        └─ Tasks (TaskList)                                 │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Estado Local (React Hooks)                                  │  │
│  │  ├─ session (user logado)                                  │  │
│  │  ├─ user (profile)                                         │  │
│  │  ├─ clients (lista de clientes)                            │  │
│  │  ├─ tasks (lista de tarefas)                               │  │
│  │  └─ theme (light/dark)                                     │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Estilos (CSS Modules + CSS Variables)                       │  │
│  │  ├─ globals.css (variáveis + reset)                       │  │
│  │  ├─ Auth.module.css                                        │  │
│  │  ├─ Dashboard.module.css                                   │  │
│  │  ├─ Sidebar.module.css                                     │  │
│  │  ├─ TopBar.module.css                                      │  │
│  │  ├─ ClientList.module.css                                  │  │
│  │  └─ TaskList.module.css                                    │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                  REST API + WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    SUPABASE (Backend)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Authentication (Supabase Auth)                              │  │
│  │  ├─ Sign Up                                                 │  │
│  │  ├─ Sign In (Email + Password)                             │  │
│  │  ├─ Sign Out                                               │  │
│  │  ├─ JWT Tokens                                             │  │
│  │  └─ Session Management                                     │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ REST API Endpoints                                          │  │
│  │  ├─ GET    /profiles                                        │  │
│  │  ├─ GET    /clients                                         │  │
│  │  ├─ POST   /clients                                         │  │
│  │  ├─ PATCH  /clients/:id                                     │  │
│  │  ├─ GET    /tasks                                           │  │
│  │  ├─ POST   /tasks                                           │  │
│  │  ├─ PATCH  /tasks/:id                                       │  │
│  │  └─ DELETE /tasks/:id                                       │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Real-time (WebSocket)                                       │  │
│  │  ├─ clients-channel                                         │  │
│  │  │  └─ INSERT, UPDATE, DELETE events                       │  │
│  │  └─ tasks-channel                                           │  │
│  │     └─ INSERT, UPDATE, DELETE events                       │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Row Level Security (RLS Policies)                           │  │
│  │  ├─ profiles (view_all, create_own)                        │  │
│  │  ├─ clients (view_all, create_own, update_own)             │  │
│  │  ├─ tasks (view_all, create_own, update_own)               │  │
│  │  └─ team_members (view_own, manage_own)                    │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    PostgreSQL Connection
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                  POSTGRESQL (Database)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ public Schema                                               │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ auth.users                                            │ │  │
│  │  │  ├─ id (UUID)                                         │ │  │
│  │  │  ├─ email (UNIQUE)                                    │ │  │
│  │  │  ├─ password_hash (ENCRYPTED)                         │ │  │
│  │  │  ├─ created_at                                        │ │  │
│  │  │  └─ updated_at                                        │ │  │
│  │  │                                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ profiles                                              │ │  │
│  │  │  ├─ id (FK: auth.users.id)                           │ │  │
│  │  │  ├─ username (UNIQUE)                                │ │  │
│  │  │  ├─ name                                             │ │  │
│  │  │  ├─ role                                             │ │  │
│  │  │  ├─ avatar_color                                     │ │  │
│  │  │  ├─ avatar_initial                                   │ │  │
│  │  │  └─ created_at, updated_at                           │ │  │
│  │  │                                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ clients                                               │ │  │
│  │  │  ├─ id (UUID, PK)                                    │ │  │
│  │  │  ├─ name                                             │ │  │
│  │  │  ├─ email                                            │ │  │
│  │  │  ├─ description                                      │ │  │
│  │  │  ├─ color                                            │ │  │
│  │  │  ├─ status (active/inactive)                         │ │  │
│  │  │  ├─ created_by (FK: profiles.id)                     │ │  │
│  │  │  └─ created_at, updated_at                           │ │  │
│  │  │  INDEX: (created_at, status)                         │ │  │
│  │  │                                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ tasks                                                 │ │  │
│  │  │  ├─ id (UUID, PK)                                    │ │  │
│  │  │  ├─ title                                            │ │  │
│  │  │  ├─ description                                      │ │  │
│  │  │  ├─ priority (low/normal/high/urgent)               │ │  │
│  │  │  ├─ status (todo/in_progress/done)                  │ │  │
│  │  │  ├─ completed (boolean)                             │ │  │
│  │  │  ├─ completed_at                                    │ │  │
│  │  │  ├─ due_date                                        │ │  │
│  │  │  ├─ assigned_to (FK: profiles.id)                   │ │  │
│  │  │  ├─ project_id (FK: projects.id, nullable)          │ │  │
│  │  │  ├─ created_by (FK: profiles.id)                    │ │  │
│  │  │  └─ created_at, updated_at                          │ │  │
│  │  │  INDEX: (completed, priority, created_at)           │ │  │
│  │  │                                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Tabelas Adicionais:                                        │  │
│  │  ├─ task_tags (para categorizar)                         │  │
│  │  ├─ notes (notas rápidas)                                │  │
│  │  ├─ schedule (eventos/agenda)                            │  │
│  │  ├─ projects (projetos por cliente)                      │  │
│  │  ├─ team_members (membros de projeto)                    │  │
│  │  └─ activity_log (auditoria)                             │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Autenticação

```
Usuario clica "Entrar"
        ↓
Form envia (email, password)
        ↓
Supabase Auth valida
        ↓
JWT Token gerado
        ↓
localStorage salva token
        ↓
App redireciona para Dashboard
        ↓
loadProfile() busca dados
        ↓
setState(user, session)
        ↓
Interface renderiza
```

### 2. Criar Cliente

```
Usuario clica "+ Novo Cliente"
        ↓
Form aparece
        ↓
Usuario preenche (name, email, description)
        ↓
handleAddClient() chamado
        ↓
Supabase.from('clients').insert()
        ↓
RLS valida (user autenticado?)
        ↓
INSERT no banco
        ↓
WebSocket notifica (realtime)
        ↓
todos os clientes veem novo cliente
```

### 3. Sincronização Real-time

```
Usuario A cria cliente
        ↓
Supabase broadcast
        ↓
WebSocket notifica todos
        ↓
onAuthStateChange() callback
        ↓
loadData() refetch
        ↓
setClients(nova lista)
        ↓
React re-renderiza
        ↓
Usuario B vê novo cliente instantaneamente
```

## Componentes

### App.jsx
- Gerencia sessão global
- Carrega profile do usuário
- Switch entre Auth e Dashboard

### Auth.jsx
- Sign up com validação
- Sign in com senha
- Mensagens de erro/sucesso

### Dashboard.jsx
- Layout principal
- Gerencia estado dos dados
- Real-time subscriptions
- Muda de view

### Sidebar.jsx
- Navegação
- Tema toggle
- User card
- Logout

### TopBar.jsx
- Título da página
- Search bar

### ClientList.jsx
- Lista de clientes
- Form para novo cliente
- Cards com info

### TaskList.jsx
- Lista de tarefas
- Form para nova tarefa
- Checkbox toggle
- Prioridade visual

## Performance

### Frontend
- React Fast Refresh (HMR)
- CSS Modules (no global scope clash)
- Lazy loading de rotas
- State local (não Redux)

### Backend
- PostgreSQL Indexes
- RLS Policies (segurança)
- Connection pooling (Supabase)
- Real-time otimizado

### Network
- Vite bundle splitting
- Gzip compression
- Cache headers
- Lazy image loading

## Segurança

### Frontend
- Valida email/senha
- Não salva credenciais localmente
- JWT stored in sessionStorage
- XSS protection (React escapa JSX)

### Backend
- Row Level Security (RLS)
- JWT verification
- Password hashing (Supabase)
- SQL injection prevention
- CORS configurado
- HTTPS enforced

### Database
- Constraints (PK, FK, UNIQUE)
- RLS Policies
- Encrypted passwords
- Audit log (activity_log)

## Escalabilidade

### Usuários
- Até 1000+ simultâneos (PostgreSQL)
- Real-time WebSocket scaling

### Dados
- 100K+ tarefas
- 10K+ clientes
- Indexes otimizados

### Storage
- Supabase oferece auto-scaling
- Backups automáticos
- Replicação

## Deploy

### Vercel
```
GitHub → Vercel
   ↓
npm run build
   ↓
dist/ → CDN
   ↓
Env vars: VITE_SUPABASE_*
```

### Netlify
```
GitHub → Netlify
   ↓
npm run build
   ↓
dist/ → CDN
   ↓
Env vars config
```

## Próximas Melhorias

- [ ] GraphQL (Apollo)
- [ ] WebSocket improvements
- [ ] Offline mode
- [ ] Service Workers
- [ ] Push notifications
- [ ] File uploads
- [ ] Video streaming
- [ ] AI integrations

---

**Arquitetura moderna, escalável e segura! 🚀**
