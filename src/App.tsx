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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div>
      {/* Sign out button — top right, unobtrusive */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2 no-print">
        <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {activePlanId
        ? <PlanEditor planId={activePlanId} onBack={goBack} />
        : <Dashboard onOpenPlan={openPlan} />
      }
    </div>
  )
}
