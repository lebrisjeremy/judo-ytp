import { useEffect } from 'react'
import { usePlanStore } from './store/planStore'
import { Dashboard } from './components/Dashboard'
import { PlanEditor } from './components/PlanEditor'
import { AuthPage } from './components/AuthPage'
import { supabase } from './lib/supabase'
import { LogOut } from 'lucide-react'

export default function App() {
  const { user, loading, init, setActivePlan, activePlanId } = usePlanStore()

  useEffect(() => { init() }, [])

  function openPlan(id: string) {
    setActivePlan(id)
    window.scrollTo(0, 0)
  }

  function goBack() {
    setActivePlan(null)
    window.scrollTo(0, 0)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bc-black)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.2em', color: '#3a3a3a' }}>
          LOADING…
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div>
      {/* Sign out — top right, floats over the black header */}
      <div className="fixed top-4 right-5 z-50 flex items-center gap-2.5 no-print">
        <span
          className="hidden sm:block"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#555', letterSpacing: '0.04em' }}
        >
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="btn-ghost-dark flex items-center gap-1.5 px-2.5 py-1.5"
          style={{ fontSize: '0.72rem' }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>

      {activePlanId
        ? <PlanEditor planId={activePlanId} onBack={goBack} />
        : <Dashboard onOpenPlan={openPlan} />
      }
    </div>
  )
}
