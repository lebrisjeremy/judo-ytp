import { useEffect } from 'react'
import { usePlanStore } from './store/planStore'
import { Dashboard } from './components/Dashboard'
import { PlanEditor } from './components/PlanEditor'

export default function App() {
  const { loadAll, setActivePlan, activePlanId } = usePlanStore()

  useEffect(() => { loadAll() }, [])

  function openPlan(id: string) {
    setActivePlan(id)
    window.scrollTo(0, 0)
  }

  function goBack() {
    setActivePlan(null)
    window.scrollTo(0, 0)
  }

  if (activePlanId) {
    return <PlanEditor planId={activePlanId} onBack={goBack} />
  }

  return <Dashboard onOpenPlan={openPlan} />
}
