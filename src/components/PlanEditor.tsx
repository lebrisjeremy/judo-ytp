import { useState, useMemo } from 'react'
import { usePlanStore } from '../store/planStore'
import { YearGrid } from './YearGrid'
import { WeekList } from './WeekList'
import { WeekEditorModal } from './WeekEditorModal'
import { RecommendationBanner } from './RecommendationBanner'
import type { Week } from '../types'
import { PHASE_LABELS, PHASE_COLORS, resolveAthleteEvents } from '../types'
import { exportToExcel } from '../lib/excel'
import { exportToPdf } from '../lib/pdf'
import { runAllRules } from '../lib/rules'
import { ArrowLeft, LayoutGrid, List, Download, FileSpreadsheet, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'

interface Props {
  planId: string
  onBack: () => void
}

function PhaseLegend() {
  const phases = Object.entries(PHASE_LABELS) as [keyof typeof PHASE_COLORS, string][]
  return (
    <div className="flex flex-wrap gap-2">
      {phases.map(([p, label]) => (
        <div key={p} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PHASE_COLORS[p] }} />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
        <span className="text-xs text-gray-500">Dev</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-500" />
        <span className="text-xs text-gray-500">Medium</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
        <span className="text-xs text-gray-500">Target</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" />
        <span className="text-xs text-gray-500">Camp</span>
      </div>
    </div>
  )
}

function PlanStats({ weeks }: { weeks: Week[] }) {
  const stats = useMemo(() => {
    const competitions = weeks.filter(w => w.weekEvent || w.weekendEvent)
    const totalMatches = weeks.reduce((sum, w) =>
      sum + (w.weekEvent?.matchCount ?? 0) + (w.weekendEvent?.matchCount ?? 0), 0)
    const phaseCounts: Record<string, number> = {}
    weeks.forEach(w => { phaseCounts[w.seasonPhase] = (phaseCounts[w.seasonPhase] ?? 0) + 1 })
    const dominantPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { competitions: competitions.length, totalMatches, dominantPhase }
  }, [weeks])

  return (
    <div className="flex gap-4 text-xs text-gray-500">
      <span><strong className="text-gray-800">{weeks.length}</strong> weeks</span>
      <span><strong className="text-gray-800">{stats.competitions}</strong> competition weeks</span>
      <span><strong className="text-gray-800">{stats.totalMatches}</strong> projected matches</span>
    </div>
  )
}

export function PlanEditor({ planId, onBack }: Props) {
  const { plans, athletes, globalEvents, updateWeek, updatePlanMode, regeneratePlan } = usePlanStore()
  const plan = plans.find(p => p.id === planId)
  const athlete = plan ? athletes.find(a => a.id === plan.athleteId) : undefined

  const [view, setView] = useState<'grid' | 'list'>('list')
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const hasEvents = (athlete?.eventRefs?.length ?? 0) > 0
  const resolvedEvents = useMemo(
    () => resolveAthleteEvents(athlete?.eventRefs ?? [], globalEvents),
    [athlete?.eventRefs, globalEvents]
  )
  const recommendations = useMemo(
    () => plan ? runAllRules(plan.weeks, resolvedEvents) : [],
    [plan, resolvedEvents]
  )

  if (!plan || !athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Plan not found.
        <button onClick={onBack} className="ml-2 text-blue-500 underline">Go back</button>
      </div>
    )
  }

  const weekBeingEdited = plan.weeks.find(w => w.weekNumber === editingWeek)

  function handleExcelExport() {
    setExporting(true)
    setTimeout(() => { exportToExcel(plan!, athlete!); setExporting(false) }, 100)
  }

  function handlePdfExport() {
    setExporting(true)
    setTimeout(() => { exportToPdf(plan!, athlete!); setExporting(false) }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: back + title */}
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-900 text-lg">{athlete.name}</h1>
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{athlete.weightClass}</span>
                </div>
                <p className="text-xs text-gray-400">{plan.title}</p>
              </div>
            </div>

            {/* Center: view toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <List size={14} /> Weekly Table
              </button>
              <button onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <LayoutGrid size={14} /> Year Grid
              </button>
            </div>

            {/* Right: mode toggle + export */}
            <div className="flex items-center gap-2">
              {/* Simple / Detailed toggle */}
              <button
                onClick={() => updatePlanMode(planId, plan.planMode === 'simple' ? 'detailed' : 'simple')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  plan.planMode === 'detailed'
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                title="Toggle between Simple (Lowan style) and Detailed (Team BC style) mode"
              >
                {plan.planMode === 'detailed'
                  ? <><ToggleRight size={16} /> Detailed</>
                  : <><ToggleLeft size={16} /> Simple</>
                }
              </button>

              {/* Regenerate from events */}
              {hasEvents && (
                <button
                  onClick={() => setConfirmRegen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-green-300 bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 transition-all"
                  title="Re-generate the plan from the athlete's competition calendar"
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
              )}

              {/* Export */}
              <button onClick={handlePdfExport} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <Download size={14} /> PDF
              </button>
              <button onClick={handleExcelExport} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + legend bar */}
      <div className="bg-white border-b border-gray-100 no-print">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-3">
          <PlanStats weeks={plan.weeks} />
          <PhaseLegend />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RecommendationBanner results={recommendations} />

        {view === 'grid'
          ? <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <YearGrid
                weeks={plan.weeks}
                planMode={plan.planMode}
                onEditWeek={setEditingWeek}
                athlete={athlete}
              />
            </div>
          : <WeekList
              weeks={plan.weeks}
              planMode={plan.planMode}
              onEditWeek={setEditingWeek}
              athlete={athlete}
            />
        }

        {/* Phase summary cards */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.entries(PHASE_LABELS) as [Week['seasonPhase'], string][]).map(([phase, label]) => {
            const count = plan.weeks.filter(w => w.seasonPhase === phase).length
            return (
              <div key={phase} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
                <div className={`w-8 h-2 rounded-full mx-auto mb-1.5`} style={{ backgroundColor: PHASE_COLORS[phase] }} />
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-400">{label.split(' ')[0]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Week editor modal */}
      {editingWeek !== null && weekBeingEdited && (
        <WeekEditorModal
          week={weekBeingEdited}
          planMode={plan.planMode}
          showWeightCycles={athlete?.showWeightCycles}
          showCardioCycles={athlete?.showCardioCycles}
          onSave={patch => updateWeek(planId, editingWeek, patch)}
          onClose={() => setEditingWeek(null)}
        />
      )}

      {/* Regenerate confirmation */}
      {confirmRegen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} className="text-green-600" />
              <h3 className="font-bold text-gray-900">Regenerate Plan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              This will recalculate all 52 weeks — phases, volume, and intensity — based on the current competition calendar.
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 mb-4">
              Any manual edits to individual weeks will be overwritten.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { regeneratePlan(planId); setConfirmRegen(false) }}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
              <button onClick={() => setConfirmRegen(false)}
                className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
