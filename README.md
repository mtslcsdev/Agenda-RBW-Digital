# 🚀 FlowDesk - RBW Digital

Platform profissional de gestão de operações e tarefas da equipe com autenticação segura via Supabase.

## ✨ Features

- ✅ **Autenticação Segura** - Supabase Auth com senhas criptografadas
- ✅ **Gestão de Clientes** - Crie e organize clientes com status e cores
- ✅ **Sistema de Tarefas** - Tarefas com prioridade, status e descrição
- ✅ **Multi-usuário** - Múltiplos usuários simultâneos com sincronização em tempo real
- ✅ **Tema Claro/Escuro** - Alternância automática de tema
- ✅ **Interface Responsiva** - Funciona perfeitamente em desktop e mobile
- ✅ **Dados Persistentes** - Tudo armazenado seguramente no Supabase
- ✅ **Row Level Security** - Segurança a nível de banco de dados

## 🛠️ Stack Técnico

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL com RLS
- **Estilo**: CSS Modules + CSS Variables
- **Deploy**: Vercel / Netlify

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
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   ├── ClientList.jsx
│   │   └── TaskList.jsx
│   ├── pages/              # Páginas completas
│   │   ├── Auth.jsx       # Tela de login/signup
│   │   └── Dashboard.jsx  # Página principal
│   ├── lib/               # Utilidades
│   │   └── supabase.js   # Client do Supabase
│   ├── styles/            # CSS Global
│   │   └── globals.css
│   ├── App.jsx           # Componente raiz
│   └── main.jsx          # Entry point
├── index.html            # HTML template
├── vite.config.js        # Config do Vite
├── package.json
├── .env                  # Variáveis de ambiente
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
