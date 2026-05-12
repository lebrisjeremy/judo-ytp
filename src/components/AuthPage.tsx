import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { JudoBCLogo, TeamBCLogo } from './Logos'

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0d0d0d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    fontFamily: 'var(--font-body)',
    position: 'relative',
    overflow: 'hidden',
  },
  /* Subtle red glow bottom-left, nothing else — clean black */
  glow: {
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 10% 90%, rgba(192,57,43,0.08) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  wrap: {
    width: '100%',
    maxWidth: '26rem',
    position: 'relative',
    zIndex: 1,
  },

  /* ── Logo bar ── */
  logoBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '0',
    padding: '0 0.5rem 1.5rem',
  },
  logoDivider: {
    width: '1px',
    height: '3rem',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },

  /* ── Red accent stripe ── */
  stripe: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, #c0392b 35%, #c0392b 65%, transparent 100%)',
    marginBottom: '1.75rem',
    borderRadius: '1px',
  },

  /* ── App wordmark ── */
  wordmark: {
    textAlign: 'center',
    marginBottom: '0.25rem',
  },
  appTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '3rem',
    letterSpacing: '0.12em',
    color: '#ffffff',
    lineHeight: 1,
    margin: 0,
  },
  appSubtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    letterSpacing: '0.22em',
    color: '#555555',
    textTransform: 'uppercase' as const,
    marginTop: '0.4rem',
    marginBottom: '1.5rem',
  },

  /* ── Form card ── */
  card: {
    background: '#111111',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '0.875rem',
    padding: '1.875rem',
  },
  tabs: {
    display: 'flex',
    background: '#080808',
    borderRadius: '0.5rem',
    padding: '0.25rem',
    marginBottom: '1.5rem',
    gap: '0.25rem',
  },
  tabActive: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: 'none',
    background: 'var(--bc-red)',
    color: '#ffffff',
    letterSpacing: '0.02em',
  },
  tabInactive: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: 'none',
    background: 'transparent',
    color: '#555555',
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '0.625rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#cccccc',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
    marginBottom: '1.25rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' },
  dividerText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: '#444444',
    letterSpacing: '0.1em',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '0.875rem' },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    color: '#555555',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.375rem',
  },
  errorBox: {
    background: 'rgba(192,57,43,0.1)',
    border: '1px solid rgba(192,57,43,0.3)',
    color: '#f87171',
    borderRadius: '0.5rem',
    padding: '0.6rem 0.75rem',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-body)',
  },
  successBox: {
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    color: '#86efac',
    borderRadius: '0.5rem',
    padding: '0.6rem 0.75rem',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-body)',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--bc-red)',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    letterSpacing: '0.12em',
    marginTop: '0.25rem',
  },
}

export function AuthPage() {
  const [tab, setTab]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />

      <div style={S.wrap}>
        {/* ── Logos ── */}
        <div style={S.logoBar}>
          <JudoBCLogo variant="dark" height={44} />
          <div style={S.logoDivider} />
          <TeamBCLogo variant="dark" height={40} />
        </div>

        {/* ── Red accent stripe ── */}
        <div style={S.stripe} />

        {/* ── App title ── */}
        <div style={S.wordmark}>
          <h1 style={S.appTitle}>JUDO YTP</h1>
          <p style={S.appSubtitle}>Yearly Training Plan Builder</p>
        </div>

        {/* ── Card ── */}
        <div style={S.card}>
          <div style={S.tabs}>
            <button
              onClick={() => { setTab('login'); setError(null); setMessage(null) }}
              style={tab === 'login' ? S.tabActive : S.tabInactive}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(null); setMessage(null) }}
              style={tab === 'signup' ? S.tabActive : S.tabInactive}
            >
              Sign Up
            </button>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{ ...S.googleBtn, opacity: loading ? 0.5 : 1 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#cccccc' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>or</span>
            <div style={S.dividerLine} />
          </div>

          <form onSubmit={handleEmailAuth} style={S.form}>
            <div>
              <label style={S.label}>Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error   && <p style={S.errorBox}>{error}</p>}
            {message && <p style={S.successBox}>{message}</p>}

            <button
              type="submit" disabled={loading}
              style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bc-red-dark)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bc-red)' }}
            >
              {loading ? 'PLEASE WAIT…' : tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
