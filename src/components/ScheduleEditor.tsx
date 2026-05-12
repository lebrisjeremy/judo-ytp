import { useState } from 'react'
import type { WeeklySchedule, DaySchedule, ScheduledSession, SessionType } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS, DAY_LABELS } from '../types'
import { Plus, Trash2, X, Edit2 } from 'lucide-react'

interface Props {
  schedules: WeeklySchedule[]
  onSave: (s: WeeklySchedule) => void
  onDelete: (id: string) => void
}

const SESSION_TYPES: SessionType[] = ['technical', 'randori', 'strength-cond', 'cardio', 'rest']

function sessionSummary(schedule: WeeklySchedule): string {
  const counts: Partial<Record<SessionType, number>> = {}
  for (const day of schedule.days) {
    for (const s of day.sessions) {
      if (s.type !== 'rest') counts[s.type] = (counts[s.type] ?? 0) + 1
    }
  }
  const parts = SESSION_TYPES
    .filter(t => t !== 'rest' && (counts[t] ?? 0) > 0)
    .map(t => `${counts[t]} ${SESSION_TYPE_LABELS[t]}`)
  return parts.length > 0 ? parts.join(' · ') : 'No sessions'
}

function SessionChip({ session, onRemove }: { session: ScheduledSession; onRemove: () => void }) {
  const color = SESSION_TYPE_COLORS[session.type]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {SESSION_TYPE_LABELS[session.type]}
      {session.duration ? ` ${session.duration}m` : ''}
      <button onClick={onRemove} className="ml-0.5 opacity-70 hover:opacity-100">
        <X size={10} />
      </button>
    </span>
  )
}

function ScheduleModal({ initial, onSave, onClose }: {
  initial?: WeeklySchedule
  onSave: (s: WeeklySchedule) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [days, setDays] = useState<DaySchedule[]>(() => {
    if (initial?.days) return initial.days
    return Array.from({ length: 7 }, (_, i) => ({ day: i as DaySchedule['day'], sessions: [] }))
  })
  const [addingType, setAddingType] = useState<{ dayIdx: number } | null>(null)
  const [duration, setDuration] = useState('')

  function addSession(dayIdx: number, type: SessionType) {
    const d = duration ? Number(duration) : undefined
    setDays(prev => prev.map((day, i) =>
      i === dayIdx ? { ...day, sessions: [...day.sessions, { type, duration: d }] } : day
    ))
    setAddingType(null)
    setDuration('')
  }

  function removeSession(dayIdx: number, sessionIdx: number) {
    setDays(prev => prev.map((day, i) =>
      i === dayIdx ? { ...day, sessions: day.sessions.filter((_, j) => j !== sessionIdx) } : day
    ))
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      days,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'var(--bc-charcoal)', borderBottom: '3px solid var(--bc-red)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.08em', color: '#fff', margin: 0 }}>
            {initial ? 'EDIT SCHEDULE' : 'NEW WEEKLY SCHEDULE'}
          </h2>
          <button onClick={onClose} className="icon-btn-dark" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Schedule Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
              placeholder="e.g. Regular Season, Pre-competition"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Weekly Sessions</label>
            <div className="space-y-2">
              {days.map((day, dayIdx) => (
                <div key={dayIdx} className="flex items-start gap-3 min-h-8">
                  <span className="shrink-0 text-xs font-semibold text-gray-500 w-8 pt-1">{DAY_LABELS[dayIdx]}</span>
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-7">
                    {day.sessions.map((s, si) => (
                      <SessionChip key={si} session={s} onRemove={() => removeSession(dayIdx, si)} />
                    ))}
                    {addingType?.dayIdx === dayIdx ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {SESSION_TYPES.map(t => (
                          <button
                            key={t}
                            onClick={() => addSession(dayIdx, t)}
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: SESSION_TYPE_COLORS[t] }}
                          >
                            {SESSION_TYPE_LABELS[t]}
                          </button>
                        ))}
                        <input
                          type="number" min={0} max={240}
                          placeholder="min"
                          className="w-14 border border-gray-300 rounded px-2 py-0.5 text-xs outline-none"
                          value={duration}
                          onChange={e => setDuration(e.target.value)}
                        />
                        <button onClick={() => setAddingType(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingType({ dayIdx })}
                        className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2 text-sm font-medium bg-[var(--bc-red)] hover:bg-[var(--bc-red-dark)] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

export function ScheduleEditor({ schedules, onSave, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<WeeklySchedule | undefined>()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function openNew() {
    setEditingSchedule(undefined)
    setShowModal(true)
  }

  function openEdit(s: WeeklySchedule) {
    setEditingSchedule(s)
    setShowModal(true)
  }

  return (
    <div className="space-y-3">
      {schedules.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No weekly schedules yet.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sessionSummary(s)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors">
                  <Edit2 size={14} />
                </button>
                {confirmDeleteId === s.id ? (
                  <span className="flex items-center gap-1">
                    <button onClick={() => { onDelete(s.id); setConfirmDeleteId(null) }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-0.5 border border-red-200 rounded">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-gray-500 px-2 py-0.5 border border-gray-200 rounded">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDeleteId(s.id)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={openNew}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Plus size={14} /> New Weekly Schedule
      </button>

      {showModal && (
        <ScheduleModal
          initial={editingSchedule}
          onSave={s => { onSave(s); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
