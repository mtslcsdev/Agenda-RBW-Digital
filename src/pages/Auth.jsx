import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isSignup) {
        // Sign up
        const { data: authData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signupError) throw signupError

        // Create profile
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: email.split('@')[0],
              name: name || email.split('@')[0],
              role: 'member',
              avatar_color: '#2D6A4F',
              avatar_initial: (name || email).charAt(0).toUpperCase(),
            })

          if (profileError) throw profileError
          setMessage('Conta criada! Verifique seu email para confirmar.')
          setIsSignup(false)
          setEmail('')
          setPassword('')
          setName('')
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message || 'Erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <div className={styles.badge}>RBW DIGITAL</div>
          <h1>Flow<span>Desk</span></h1>
          <p>Gestão de Operações</p>
        </div>

        {error && <div className={styles.error}>⚠️ {error}</div>}
        {message && <div className={styles.message}>✓ {message}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          {isSignup && (
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required={isSignup}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Carregando...' : isSignup ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className={styles.footer}>
          {isSignup ? (
            <>
              Já tem conta? <button onClick={() => { setIsSignup(false); setError(''); }} className={styles.link}>Entrar</button>
            </>
          ) : (
            <>
              Não tem conta? <button onClick={() => { setIsSignup(true); setError(''); }} className={styles.link}>Criar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
