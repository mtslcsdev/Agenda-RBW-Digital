# 🚀 Como Subir no GitHub

## Passo 1: Verificar Repositório Remoto

```bash
cd C:/Users/mayra/flowdesk

# Ver configuração atual
git remote -v
```

## Passo 2: Adicionar Repositório Remoto

### Se você JÁ tem um repositório

```bash
# Adicionar origin
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Ou atualizar se já existe
git remote set-url origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

## Passo 3: Fazer Push

### Primeira vez (criar branch main)

```bash
git branch -M main
git push -u origin main
```

### Próximas vezes

```bash
git push
```

## Passo 4: Proteger Variáveis de Ambiente

Seu `.env` **NUNCA** será commitado porque está em `.gitignore`.

**Para seu repositório no GitHub**, adicione as variáveis lá:

### No GitHub: Settings → Secrets and variables → Actions

Adicione:
```
VITE_SUPABASE_URL: https://sqrwbgagdigluymfimup.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiI...
```

## ✅ Verificação de Segurança

Antes de fazer push, confirme:

```bash
# Verificar se .env está em .gitignore
cat .gitignore | grep .env

# Ver o que vai ser commitado
git status

# Nunca deve ter:
# - .env
# - node_modules/
# - dist/
```

## 📋 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] `.env` está em `.gitignore`
- [ ] `npm install` funciona
- [ ] `npm run dev` abre em `http://localhost:5173`
- [ ] Login/signup funciona
- [ ] Clientes podem ser criados
- [ ] Tarefas podem ser criadas
- [ ] Multi-usuário funciona (teste em 2 abas)
- [ ] Git remoto configurado
- [ ] Push feito com sucesso

## 🔐 Compartilhar Credenciais do Supabase

Seu chefe/amigos precisam das credenciais para rodar local:

**Envie APENAS:**
```env
VITE_SUPABASE_URL=https://sqrwbgagdigluymfimup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcndiZ2FnZGlnbHV5bWZpbXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAzNTExMjcsImV4cCI6MTk5NTk1MTEyN30.JjLxhJXAaVP7XYfz00Z8iVV0cSqEWVk3t0xKKH0wI84
```

Eles devem:
1. Clonar o repositório
2. Criar um arquivo `.env` na raiz
3. Colar essas credenciais
4. Rodar `npm install && npm run dev`

## 🚀 Deploy (Próximo Passo)

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
1. Conectar GitHub
2. Build: `npm run build`
3. Folder: `dist`
4. Environment: adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

## 🆘 Problemas Comuns

### "fatal: not a git repository"
```bash
cd C:/Users/mayra/flowdesk
git status
```

### "remote already exists"
```bash
git remote remove origin
git remote add origin https://...
```

### "Permission denied (publickey)"
```bash
# Configure SSH no GitHub ou use HTTPS
git remote set-url origin https://github.com/user/repo.git
```

### "Não consigo fazer push"
```bash
# Verificar credenciais
git config --global user.email
git config --global user.name

# Atualizar se necessário
git config --global user.email "mateuslucasdev@gmail.com"
git config --global user.name "Mateus Lucas"
```

## 📞 URLs Importantes

- **Seu Projeto**: https://sqrwbgagdigluymfimup.supabase.co
- **Dashboard Supabase**: https://app.supabase.com/projects
- **GitHub**: https://github.com/seu-usuario

---

**Pronto! Seu código está seguro no GitHub com Supabase! 🎉**
