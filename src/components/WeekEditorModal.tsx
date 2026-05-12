import { useState, useEffect } from 'react'
import type { Week, SeasonPhase, CompType, Competition, WeightCycle, CardioCycle } from '../types'
import { PHASE_LABELS, PHASE_BG, VOLUME_LABELS, INTENSITY_LABELS, IMPORTANCE_STARS,
  WEIGHT_CYCLE_LABELS, WEIGHT_CYCLE_COLORS,
  CARDIO_CYCLE_LABELS, CARDIO_CYCLE_COLORS } from '../types'
import { weekRange } from '../lib/dates'
import { X } from 'lucide-react'

interface Props {
  week: Week
  planMode: 'simple' | 'detailed'
  showWeightCycles?: boolean
  showCardioCycles?: boolean
  onSave: (patch: Partial<Week>) => void
  onClose: () => void
}

const WEIGHT_CYCLES: WeightCycle[] = [
  'reathletisation', 'strength-endurance', 'max-strength', 'power', 'reactive', 'maintenance',
]
const CARDIO_CYCLES: CardioCycle[] = [
  'aerobic-base', 'aerobic-power', 'lactic-capacity', 'lactic-power', 'alactic-power', 'speed-coordination',
]

const PHASES: SeasonPhase[] = ['forge', 'sculpt', 'conversion', 'sharpening', 'battle', 'transition']
const COMP_TYPES: { value: CompType; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'medium', label: 'Medium' },
  { value: 'target', label: 'Target' },
  { value: 'camp', label: 'Training Camp' },
]

function CompetitionEditor({ label, value, onChange }: {
  label: string
  value?: Competition
  onChange: (c: Competition | undefined) => void
}) {
  const [enabled, setEnabled] = useState(!!value)
  const [name, setName] = useState(value?.name ?? '')
  const [importance, setImportance] = useState<1|2|3|4|5>(value?.importance ?? 2)
  const [type, setType] = useState<CompType>(value?.type ?? 'development')
  const [matchCount, setMatchCount] = useState(value?.matchCount ?? 0)
  const [location, setLocation] = useState(value?.location ?? '')

  useEffect(() => {
    if (!enabled) { onChange(undefined); return }
    if (name) onChange({ name, importance, type, matchCount: matchCount || undefined, location: location || undefined })
  }, [enabled, name, importance, type, matchCount, location])

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-red-600" />
          <span className="text-xs text-gray-500">Has event</span>
        </label>
      </div>
      {enabled && (
        <div className="space-y-2">
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
            placeholder="Event name" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                value={type} onChange={e => setType(e.target.value as CompType)}>
                {COMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Importance</label>
              <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                value={importance} onChange={e => setImportance(Number(e.target.value) as 1|2|3|4|5)}>
                {[1,2,3,4,5].map(i => <option key={i} value={i}>{IMPORTANCE_STARS[i-1]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Match count</label>
              <input type="number" min={0} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                value={matchCount || ''} onChange={e => setMatchCount(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function WeekEditorModal({ week, planMode, showWeightCycles, showCardioCycles, onSave, onClose }: Props) {
  const [phase, setPhase] = useState<SeasonPhase>(week.seasonPhase)
  const [weightCycle, setWeightCycle] = useState<WeightCycle | undefined>(week.weightCycle)
  const [cardioCycle, setCardioCycle] = useState<CardioCycle | undefined>(week.cardioCycle)
  const [volume, setVolume] = useState<1|2|3|4|5>(week.volume)
  const [intensity, setIntensity] = useState<1|2|3|4|5>(week.intensity)
  const [weekEvent, setWeekEvent] = useState<Competition | undefined>(week.weekEvent)
  const [weekendEvent, setWeekendEvent] = useState<Competition | undefined>(week.weekendEvent)
  const [mandalaFocus, setMandalaFocus] = useState(week.mandalaFocus ?? '')
  const [notes, setNotes] = useState(week.notes ?? '')
  const [location, setLocation] = useState<Week['location']>(week.location ?? 'home')
  const [sessions, setSessions] = useState(week.sessions ?? {
    randori: 0, technical: 0, strengthCond: 0, cardio: 0, physicalTesting: false, tournament: false,
  })

  function handleSave() {
    onSave({
      seasonPhase: phase,
      weightCycle,
      cardioCycle,
      volume,
      intensity,
      weekEvent,
      weekendEvent,
      mandalaFocus: mandalaFocus || undefined,
      notes: notes || undefined,
      location,
      sessions: planMode === 'detailed' ? sessions : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Dark header */}
        <div style={{ background: 'var(--bc-charcoal)', borderBottom: '3px solid var(--bc-red)' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.08em', color: '#fff', lineHeight: 1, margin: 0 }}>
                WEEK {week.weekNumber}
              </h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: '#666', marginTop: '0.3rem' }}>
                {weekRange(week.startDate, week.endDate).toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} className="icon-btn-dark" style={{ padding: '0.4rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Season Phase */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Season Phase</label>
            <div className="flex flex-wrap gap-2">
              {PHASES.map(p => (
                <button key={p} onClick={() => setPhase(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${
                    phase === p
                      ? `${PHASE_BG[p]} text-white border-transparent shadow-sm`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}>
                  {PHASE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Cycle */}
          {showWeightCycles && (
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Weight Training Cycle</label>
              <div className="flex flex-wrap gap-1.5">
                {WEIGHT_CYCLES.map(c => (
                  <button key={c} onClick={() => setWeightCycle(c === weightCycle ? undefined : c)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all"
                    style={weightCycle === c
                      ? { backgroundColor: WEIGHT_CYCLE_COLORS[c], color: 'white', borderColor: WEIGHT_CYCLE_COLORS[c] }
                      : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                    }>
                    {WEIGHT_CYCLE_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cardio Cycle */}
          {showCardioCycles && (
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Cardio Cycle</label>
              <div className="flex flex-wrap gap-1.5">
                {CARDIO_CYCLES.map(c => (
                  <button key={c} onClick={() => setCardioCycle(c === cardioCycle ? undefined : c)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all"
                    style={cardioCycle === c
                      ? { backgroundColor: CARDIO_CYCLE_COLORS[c], color: 'white', borderColor: CARDIO_CYCLE_COLORS[c] }
                      : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                    }>
                    {CARDIO_CYCLE_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Volume & Intensity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Volume (1-5)</label>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setVolume(v as 1|2|3|4|5)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      volume === v ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{VOLUME_LABELS[volume].split(' – ')[1]}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Intensity (1-5)</label>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setIntensity(v as 1|2|3|4|5)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      intensity === v ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{INTENSITY_LABELS[intensity].split(': ')[1]}</p>
            </div>
          </div>

          {/* Session counts (Detailed mode) */}
          {planMode === 'detailed' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Sessions per Week</label>
              <div className="grid grid-cols-4 gap-3">
                {([
                  ['randori', 'Randori'],
                  ['technical', 'Technical'],
                  ['strengthCond', 'S&C'],
                  ['cardio', 'Cardio'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input type="number" min={0} max={7}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
                      value={(sessions[key] as number) || ''}
                      onChange={e => setSessions({ ...sessions, [key]: Number(e.target.value) })}
                      placeholder="0" />
                  </div>
                ))}
                <div className="flex items-end gap-3 col-span-3">
                  {(['physicalTesting', 'tournament'] as const).map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sessions[key]}
                        onChange={e => setSessions({ ...sessions, [key]: e.target.checked })}
                        className="w-4 h-4 accent-red-600 rounded" />
                      <span className="text-sm text-gray-600 capitalize">{key === 'physicalTesting' ? 'Physical Testing' : 'Tournament'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Events</label>
            <CompetitionEditor label="Week Event" value={weekEvent} onChange={setWeekEvent} />
            <CompetitionEditor label="Weekend Event" value={weekendEvent} onChange={setWeekendEvent} />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Location</label>
            <div className="flex gap-2">
              {(['home', 'travel', 'camp'] as const).map(l => (
                <button key={l} onClick={() => setLocation(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 capitalize ${
                    location === l ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Mandala Focus */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Mandala / Focus</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600"
              placeholder="e.g. uchimata | Grip strength | Mental reset"
              value={mandalaFocus} onChange={e => setMandalaFocus(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Notes</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600 resize-none"
              rows={2} placeholder="Coach notes, observations, adjustments..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm">
            Save Week
          </button>
        </div>
      </div>
    </div>
  )
}
