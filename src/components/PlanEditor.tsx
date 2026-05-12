import { useState, useMemo } from 'react'
import { usePlanStore } from '../store/planStore'
import { YearGrid } from './YearGrid'
import { WeekList } from './WeekList'
import { WeekEditorModal } from './WeekEditorModal'
import { RecommendationBanner } from './RecommendationBanner'
import { SessionsView } from './SessionsView'
import { TechnicalCalendar } from './TechnicalCalendar'
import { JudoSessionsView } from './JudoSessionsView'
import type { Week } from '../types'
import { PHASE_LABELS, PHASE_COLORS, resolveAthleteEvents } from '../types'
import { exportToExcel } from '../lib/excel'
import { exportToPdf } from '../lib/pdf'
import { runAllRules } from '../lib/rules'
import { generateTechnicalCycles } from '../lib/technicalPeriodization'
import { ArrowLeft, LayoutGrid, List, Download, FileSpreadsheet, ToggleLeft, ToggleRight, RefreshCw, Dumbbell, Target, Swords } from 'lucide-react'

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
          <span className="text-xs" style={{ color: 'var(--judo-muted)' }}>{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 pl-2" style={{ borderLeft: '1px solid var(--bc-steel)' }}>
        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
        <span className="text-xs" style={{ color: 'var(--judo-muted)' }}>Dev</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-500" />
        <span className="text-xs" style={{ color: 'var(--judo-muted)' }}>Medium</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
        <span className="text-xs" style={{ color: 'var(--judo-muted)' }}>Target</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500" />
        <span className="text-xs" style={{ color: 'var(--judo-muted)' }}>Camp</span>
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
    <div className="flex gap-4 text-xs" style={{ color: 'var(--judo-muted)' }}>
      <span><strong style={{ color: 'var(--judo-text)' }}>{weeks.length}</strong> weeks</span>
      <span><strong style={{ color: 'var(--judo-text)' }}>{stats.competitions}</strong> competition weeks</span>
      <span><strong style={{ color: 'var(--judo-text)' }}>{stats.totalMatches}</strong> projected matches</span>
    </div>
  )
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.4rem 0.9rem',
  borderRadius: '0.35rem',
  fontSize: '0.78rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s',
  background: active ? 'var(--bc-red)' : 'transparent',
  color: active ? '#ffffff' : '#777777',
  letterSpacing: '0.01em',
})

export function PlanEditor({ planId, onBack }: Props) {
  const {
    plans, athletes, globalEvents, judoSessions,
    updateWeek, updatePlanMode, regeneratePlan,
    saveTechnicalCycles, generateAndSaveJudoSessions, deleteJudoSession,
  } = usePlanStore()
  const plan = plans.find(p => p.id === planId)
  const athlete = plan ? athletes.find(a => a.id === plan.athleteId) : undefined

  const [view, setView] = useState<'grid' | 'list' | 'sessions' | 'technical' | 'judo'>('list')
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const planJudoSessions = useMemo(
    () => judoSessions.filter(s => s.planId === planId),
    [judoSessions, planId],
  )
  const technicalCycles = useMemo(() => {
    if (plan?.technicalCycles && plan.technicalCycles.length > 0) return plan.technicalCycles
    if (!plan) return []
    // Fall back to a computed-on-the-fly preview if the plan hasn't persisted any.
    return generateTechnicalCycles(plan.weeks, athlete?.technicalProfile)
  }, [plan, athlete?.technicalProfile])

  async function handleRegenerateTechnical() {
    if (!plan) return
    const cycles = generateTechnicalCycles(plan.weeks, athlete?.technicalProfile)
    await saveTechnicalCycles(planId, cycles)
  }
  async function handleGenerateJudoSessions() {
    await generateAndSaveJudoSessions(planId)
  }

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
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--judo-muted)' }}>
        Plan not found.
        <button onClick={onBack} className="ml-2 underline" style={{ color: 'var(--bc-red)' }}>Go back</button>
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
    <div className="min-h-screen" style={{ background: 'var(--bc-snow)' }}>

      {/* ── BC-branded sticky top nav ── */}
      <div className="bc-header sticky top-0 z-30 no-print">
        <div className="bc-header-inner" style={{ padding: '0.9rem 1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>

          {/* Left: back + athlete info */}
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="icon-btn-dark" style={{ padding: '0.4rem' }}>
              <ArrowLeft size={17} />
            </button>
            <div className="bc-divider-v" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.08em', color: '#fff', lineHeight: 1 }}>
                  {athlete.name.toUpperCase()}
                </span>
                <span className="badge-weight">{athlete.weightClass}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.18em', color: '#555', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {plan.title}
              </p>
            </div>
          </div>

          {/* Center: view tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.2rem', gap: '0.1rem', flexWrap: 'wrap' }}>
            <button onClick={() => setView('list')} style={tabStyle(view === 'list')}>
              <List size={13} /> Weekly Table
            </button>
            <button onClick={() => setView('grid')} style={tabStyle(view === 'grid')}>
              <LayoutGrid size={13} /> Year Grid
            </button>
            <button onClick={() => setView('sessions')} style={tabStyle(view === 'sessions')}>
              <Dumbbell size={13} /> Sessions
            </button>
            <button onClick={() => setView('technical')} style={tabStyle(view === 'technical')}>
              <Target size={13} /> Technical
            </button>
            <button onClick={() => setView('judo')} style={tabStyle(view === 'judo')}>
              <Swords size={13} /> Judo Sessions
            </button>
          </div>

          {/* Right: mode toggle + export */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePlanMode(planId, plan.planMode === 'simple' ? 'detailed' : 'simple')}
              className="btn-ghost-dark flex items-center gap-2 px-3 py-1.5"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
              title="Toggle between Simple and Detailed mode"
            >
              {plan.planMode === 'detailed'
                ? <><ToggleRight size={15} /> Detailed</>
                : <><ToggleLeft size={15} /> Simple</>
              }
            </button>

            {hasEvents && (
              <button
                onClick={() => setConfirmRegen(true)}
                className="btn-ghost-dark flex items-center gap-1.5 px-3 py-1.5"
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4ade80', borderColor: 'rgba(74,222,128,0.2)' }}
                title="Re-generate the plan from the athlete's competition calendar"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            )}

            <button onClick={handlePdfExport} disabled={exporting}
              className="btn-ghost-dark flex items-center gap-1.5 px-3 py-1.5"
              style={{ fontSize: '0.78rem' }}>
              <Download size={13} /> PDF
            </button>
            <button onClick={handleExcelExport} disabled={exporting}
              className="btn-ghost-dark flex items-center gap-1.5 px-3 py-1.5"
              style={{ fontSize: '0.78rem' }}>
              <FileSpreadsheet size={13} /> Excel
            </button>
          </div>
        </div>

        {/* Stats + legend strip */}
        <div style={{ background: 'var(--bc-charcoal)', borderTop: '1px solid var(--bc-steel)' }} className="no-print">
          <div className="max-w-7xl mx-auto px-5 py-2 flex items-center justify-between flex-wrap gap-3">
            <PlanStats weeks={plan.weeks} />
            <PhaseLegend />
          </div>
        </div>

        <div className="bc-red-stripe" />
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RecommendationBanner results={recommendations} />

        {view === 'sessions' ? (
          <SessionsView plan={plan} athlete={athlete} />
        ) : view === 'technical' ? (
          <TechnicalCalendar
            weeks={plan.weeks}
            cycles={technicalCycles}
            onRegenerateCycles={handleRegenerateTechnical}
          />
        ) : view === 'judo' ? (
          <JudoSessionsView
            sessions={planJudoSessions}
            weeks={plan.weeks}
            cycles={technicalCycles}
            planId={planId}
            profile={athlete?.technicalProfile}
            onGenerate={handleGenerateJudoSessions}
            onDeleteSession={deleteJudoSession}
          />
        ) : view === 'grid' ? (
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: 'var(--bc-border)' }}>
            <YearGrid
              weeks={plan.weeks}
              planMode={plan.planMode}
              onEditWeek={setEditingWeek}
              athlete={athlete}
            />
          </div>
        ) : (
          <WeekList
            weeks={plan.weeks}
            planMode={plan.planMode}
            onEditWeek={setEditingWeek}
            athlete={athlete}
          />
        )}

        {/* Phase summary cards */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.entries(PHASE_LABELS) as [Week['seasonPhase'], string][]).map(([phase, label]) => {
            const count = plan.weeks.filter(w => w.seasonPhase === phase).length
            return (
              <div key={phase} className="bg-white rounded-xl border p-3 text-center shadow-sm" style={{ borderColor: 'var(--bc-border)' }}>
                <div className="w-8 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                <div className="text-lg font-bold" style={{ color: 'var(--bc-text)' }}>{count}</div>
                <div className="text-xs" style={{ color: 'var(--bc-muted)' }}>{label.split(' ')[0]}</div>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4" style={{ border: '1px solid var(--bc-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} style={{ color: 'var(--bc-red)' }} />
              <h3 className="font-bold text-gray-900">Regenerate Plan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              This will recalculate all 52 weeks — phases, volume, and intensity — based on the current competition calendar.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 mb-4">
              Any manual edits to individual weeks will be overwritten.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { regeneratePlan(planId); setConfirmRegen(false) }}
                className="btn-primary text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5"
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
