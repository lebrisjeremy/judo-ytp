import { useState } from 'react'
import { usePlanStore } from '../store/planStore'
import type { YearlyPlan, Athlete, GeneratedSession } from '../types'
import { PHASE_LABELS, PHASE_COLORS, CARDIO_CYCLE_LABELS, WEIGHT_CYCLE_LABELS } from '../types'
import { generateCardioSession, generateWeightSession, cardioSessionCount, weightSessionCount } from '../lib/sessiongen'
import { exportSessionPdf, exportWeekSessionsPdf, exportAllSessionsPdf } from '../lib/sessionpdf'
import { weekRange } from '../lib/dates'
import { format } from 'date-fns'
import { Download, RefreshCw, ChevronDown, ChevronUp, Dumbbell, Activity, Trash2 } from 'lucide-react'

interface Props {
  plan: YearlyPlan
  athlete: Athlete
}

function cycleBadge(session: GeneratedSession): string {
  if (session.sessionType === 'cardio') {
    return CARDIO_CYCLE_LABELS[session.cycleName as keyof typeof CARDIO_CYCLE_LABELS] ?? session.cycleName
  }
  return WEIGHT_CYCLE_LABELS[session.cycleName as keyof typeof WEIGHT_CYCLE_LABELS] ?? session.cycleName
}

function SessionCard({
  session,
  plan,
  athlete,
  onRegenerate,
  onDelete,
}: {
  session: GeneratedSession
  plan: YearlyPlan
  athlete: Athlete
  onRegenerate: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const c = session.content
  const isCardio = session.sessionType === 'cardio'

  function handleRegen() {
    if (session.isEdited) { setConfirmRegen(true) } else { onRegenerate() }
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-lg ${isCardio ? 'bg-amber-100' : 'bg-green-100'}`}>
            {isCardio ? <Activity size={14} className="text-amber-600" /> : <Dumbbell size={14} className="text-green-700" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {cycleBadge(session)} · ~{c.estimatedDuration} min
              {session.isEdited && <span className="ml-2 text-blue-500">edited</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); exportSessionPdf(session, athlete, plan) }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Download session PDF"
          >
            <Download size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleRegen() }}
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Regenerate session"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete session"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-4 text-sm">
          <SessionBlock label="Objective" text={c.objective} />
          <SessionBlock label="Intensity Target" text={c.intensityTarget} highlight />
          <SessionBlock label="Warm-Up" text={c.warmUp} />

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Main Set</p>
            {c.mainSet && <p className="text-sm text-gray-700 mb-3">{c.mainSet}</p>}
            {c.exercises && c.exercises.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-medium">
                      <th className="px-3 py-2 text-left">Exercise</th>
                      <th className="px-2 py-2 text-center w-12">Sets</th>
                      <th className="px-2 py-2 text-center w-16">Reps</th>
                      <th className="px-2 py-2 text-center w-16">Rest</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.exercises.map((ex, i) => (
                      <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-3 py-2 font-medium text-gray-800">{ex.name}</td>
                        <td className="px-2 py-2 text-center text-gray-600 font-mono">{ex.sets}</td>
                        <td className="px-2 py-2 text-center text-gray-600 font-mono">{ex.reps}</td>
                        <td className="px-2 py-2 text-center text-gray-500">{ex.rest}</td>
                        <td className="px-3 py-2 text-gray-400">{ex.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <SessionBlock label="Rest Periods" text={c.restPeriods} />
          <SessionBlock label="Cool-Down" text={c.coolDown} />
          <SessionBlock label="Coaching Notes" text={c.coachingNotes} italic />
        </div>
      )}

      {/* Regenerate confirm */}
      {confirmRegen && (
        <div className="px-4 pb-4 border-t border-amber-100 bg-amber-50 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800">This session has been edited. Regenerate and overwrite?</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { onRegenerate(); setConfirmRegen(false) }}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg">
              Regenerate
            </button>
            <button onClick={() => setConfirmRegen(false)}
              className="text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">
              Keep
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="px-4 pb-4 border-t border-red-100 bg-red-50 flex items-center justify-between gap-3">
          <p className="text-xs text-red-800">Delete this session? It won't regenerate automatically.</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { onDelete(); setConfirmDelete(false) }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg">
              Delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionBlock({ label, text, highlight, italic }: {
  label: string; text: string; highlight?: boolean; italic?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'text-blue-700 font-medium' : 'text-gray-700'} ${italic ? 'italic' : ''}`}>
        {text}
      </p>
    </div>
  )
}

function WeekSelector({
  weeks,
  selectedWeek,
  sessions,
  onSelect,
}: {
  weeks: YearlyPlan['weeks']
  selectedWeek: number
  sessions: GeneratedSession[]
  onSelect: (n: number) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {weeks.map(w => {
        const hasSessions = sessions.some(s => s.weekNumber === w.weekNumber)
        const isSel = w.weekNumber === selectedWeek
        return (
          <button
            key={w.weekNumber}
            onClick={() => onSelect(w.weekNumber)}
            title={weekRange(w.startDate, w.endDate)}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-semibold transition-all border-2 relative ${
              isSel
                ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
            style={!isSel ? { borderColor: PHASE_COLORS[w.seasonPhase] + '60' } : undefined}
          >
            {w.weekNumber}
            {hasSessions && !isSel && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SessionsView({ plan, athlete }: Props) {
  const { generatedSessions, saveGeneratedSession, deleteGeneratedSession } = usePlanStore()
  const [selectedWeekNum, setSelectedWeekNum] = useState(plan.weeks[0]?.weekNumber ?? 1)

  const planSessions = generatedSessions.filter(s => s.planId === plan.id)
  const weekSessions = planSessions.filter(s => s.weekNumber === selectedWeekNum)
  const selectedWeek = plan.weeks.find(w => w.weekNumber === selectedWeekNum)

  function makeSession(
    type: 'cardio' | 'weight',
    n: 1 | 2,
    week: typeof selectedWeek,
  ): GeneratedSession | null {
    if (!week) return null
    const content = type === 'cardio'
      ? generateCardioSession(week, n)
      : generateWeightSession(week, n)
    const cycleName = type === 'cardio'
      ? (week.cardioCycle ?? 'aerobic-base')
      : (week.weightCycle ?? 'reathletisation')
    return {
      id: crypto.randomUUID(),
      planId: plan.id,
      weekNumber: week.weekNumber,
      sessionType: type,
      sessionNumber: n,
      cycleName,
      content,
      isEdited: false,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }
  }

  function generateWeek() {
    if (!selectedWeek) return
    const cardioCount = cardioSessionCount(selectedWeek)
    const weightCount = weightSessionCount(selectedWeek)

    const toGenerate: GeneratedSession[] = []
    for (let n = 1 as 1 | 2; n <= cardioCount; n++) {
      const existing = weekSessions.find(s => s.sessionType === 'cardio' && s.sessionNumber === n)
      if (!existing) {
        const s = makeSession('cardio', n, selectedWeek)
        if (s) toGenerate.push(s)
      }
    }
    for (let n = 1 as 1 | 2; n <= weightCount; n++) {
      const existing = weekSessions.find(s => s.sessionType === 'weight' && s.sessionNumber === n)
      if (!existing) {
        const s = makeSession('weight', n, selectedWeek)
        if (s) toGenerate.push(s)
      }
    }
    // If nothing to add (all already exist), generate anyway for all
    if (toGenerate.length === 0) {
      for (let n = 1 as 1 | 2; n <= Math.max(cardioCount, 1); n++) {
        const s = makeSession('cardio', n, selectedWeek); if (s) toGenerate.push(s)
      }
      for (let n = 1 as 1 | 2; n <= Math.max(weightCount, 1); n++) {
        const s = makeSession('weight', n, selectedWeek); if (s) toGenerate.push(s)
      }
    }
    toGenerate.forEach(s => saveGeneratedSession(s))
  }

  function regenSession(session: GeneratedSession) {
    if (!selectedWeek) return
    const fresh = makeSession(session.sessionType, session.sessionNumber, selectedWeek)
    if (!fresh) return
    const updated = { ...fresh, id: session.id, createdAt: session.createdAt }
    saveGeneratedSession(updated)
  }

  const hasWeekSessions = weekSessions.length > 0
  const cardioSessions = weekSessions.filter(s => s.sessionType === 'cardio').sort((a, b) => a.sessionNumber - b.sessionNumber)
  const weightSessions = weekSessions.filter(s => s.sessionType === 'weight').sort((a, b) => a.sessionNumber - b.sessionNumber)

  return (
    <div className="space-y-6">
      {/* Week selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Select Week</h2>
          {planSessions.length > 0 && (
            <button
              onClick={() => exportAllSessionsPdf(planSessions, athlete, plan)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <Download size={13} /> All Sessions PDF
            </button>
          )}
        </div>
        <WeekSelector
          weeks={plan.weeks}
          selectedWeek={selectedWeekNum}
          sessions={planSessions}
          onSelect={setSelectedWeekNum}
        />
      </div>

      {/* Selected week info + actions */}
      {selectedWeek && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">Week {selectedWeek.weekNumber}</span>
                <span className="text-xs text-gray-500">{weekRange(selectedWeek.startDate, selectedWeek.endDate)}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: PHASE_COLORS[selectedWeek.seasonPhase] }}
                >
                  {PHASE_LABELS[selectedWeek.seasonPhase]}
                </span>
                {selectedWeek.weekEvent && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {selectedWeek.weekEvent.name} (tournament)
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>Cardio sessions: <strong className="text-gray-700">{cardioSessionCount(selectedWeek)}</strong></span>
                <span>Weight sessions: <strong className="text-gray-700">{weightSessionCount(selectedWeek)}</strong></span>
                <span>Vol <strong className="text-gray-700">{selectedWeek.volume}</strong></span>
                <span>Int <strong className="text-gray-700">{selectedWeek.intensity}</strong></span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {hasWeekSessions && (
                <button
                  onClick={() => exportWeekSessionsPdf(weekSessions, athlete, plan, selectedWeekNum)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <Download size={13} /> Week PDF
                </button>
              )}
              <button
                onClick={generateWeek}
                className="flex items-center gap-1.5 text-xs text-white bg-[var(--bc-red)] hover:bg-[var(--bc-red-dark)] px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw size={13} /> {hasWeekSessions ? 'Re-generate Week' : 'Generate Week'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      {hasWeekSessions ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {cardioSessions.length > 0 && (
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                <Activity size={12} /> Cardio
              </p>
            )}
            {cardioSessions.map(s => (
              <SessionCard key={s.id} session={s} plan={plan} athlete={athlete}
                onRegenerate={() => regenSession(s)}
                onDelete={() => deleteGeneratedSession(s.id)} />
            ))}
          </div>
          <div className="space-y-3">
            {weightSessions.length > 0 && (
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                <Dumbbell size={12} /> Weight Training
              </p>
            )}
            {weightSessions.map(s => (
              <SessionCard key={s.id} session={s} plan={plan} athlete={athlete}
                onRegenerate={() => regenSession(s)}
                onDelete={() => deleteGeneratedSession(s.id)} />
            ))}
          </div>
        </div>
      ) : selectedWeek ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <Activity size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sessions generated for Week {selectedWeekNum} yet.</p>
          <p className="text-xs mt-1 mb-4">Click "Generate Week" to create cardio and weight sessions based on the YTP.</p>
          <button
            onClick={generateWeek}
            className="inline-flex items-center gap-1.5 text-sm text-white bg-[var(--bc-red)] hover:bg-[var(--bc-red-dark)] px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Generate Week {selectedWeekNum}
          </button>
        </div>
      ) : null}
    </div>
  )
}
