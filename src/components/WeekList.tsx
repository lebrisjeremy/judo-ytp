import type { Week, Athlete } from '../types'
import { PHASE_LABELS, PHASE_COLORS, IMPORTANCE_STARS, LEVEL_LABELS,
  WEIGHT_CYCLE_LABELS, WEIGHT_CYCLE_SHORT, WEIGHT_CYCLE_COLORS,
  CARDIO_CYCLE_LABELS, CARDIO_CYCLE_SHORT, CARDIO_CYCLE_COLORS } from '../types'
import { weekRange, monthOf } from '../lib/dates'
import { Edit2, MapPin } from 'lucide-react'

interface Props {
  weeks: Week[]
  planMode: 'simple' | 'detailed'
  onEditWeek: (weekNumber: number) => void
  athlete?: Athlete
}

function PhaseChip({ phase }: { phase: Week['seasonPhase'] }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: PHASE_COLORS[phase] }}>
      {PHASE_LABELS[phase]}
    </span>
  )
}

function EventBadge({ evt }: { evt: NonNullable<Week['weekEvent']> }) {
  const colors = {
    development: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    medium: 'bg-orange-100 border-orange-300 text-orange-800',
    target: 'bg-red-100 border-red-400 text-red-800',
    camp: 'bg-blue-100 border-blue-300 text-blue-800',
  }
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${colors[evt.type]}`}>
      <span>{evt.name}</span>
      <span className="text-yellow-600">{IMPORTANCE_STARS[evt.importance - 1]}</span>
      {evt.matchCount ? <span className="text-gray-500">({evt.matchCount} matches)</span> : null}
    </div>
  )
}

function VolBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-2 bg-gray-100 rounded-sm overflow-hidden">
        <div className="h-full rounded-sm" style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono font-bold text-gray-500">{LEVEL_LABELS[value]}</span>
    </div>
  )
}

export function WeekList({ weeks, planMode, onEditWeek, athlete }: Props) {
  // Group into month sections
  const months: { month: string; weeks: Week[] }[] = []
  for (const w of weeks) {
    const m = monthOf(w.startDate)
    const last = months[months.length - 1]
    if (last && last.month === m) last.weeks.push(w)
    else months.push({ month: m, weeks: [w] })
  }

  return (
    <div className="space-y-6">
      {months.map(({ month, weeks: mWeeks }) => (
        <div key={month}>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">{month}</h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Dates</th>
                  <th className="px-4 py-2 text-left">Phase</th>
                  <th className="px-4 py-2 text-center">Vol</th>
                  <th className="px-4 py-2 text-center">Int</th>
                  {planMode === 'detailed' && <>
                    <th className="px-4 py-2 text-center">Rnd</th>
                    <th className="px-4 py-2 text-center">Tech</th>
                    <th className="px-4 py-2 text-center">S&C</th>
                    <th className="px-4 py-2 text-center">Cardio</th>
                  </>}
                  {athlete?.showWeightCycles && <th className="px-4 py-2 text-center">Weight</th>}
                  {athlete?.showCardioCycles && <th className="px-4 py-2 text-center">Cardio</th>}
                  <th className="px-4 py-2 text-left">Events</th>
                  <th className="px-4 py-2 text-left">Focus / Notes</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {mWeeks.map((w, i) => (
                  <tr key={w.weekNumber}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                    onClick={() => onEditWeek(w.weekNumber)}>
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{w.weekNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {weekRange(w.startDate, w.endDate)}
                      {w.location && w.location !== 'home' && (
                        <span className="ml-1 inline-flex items-center">
                          <MapPin size={10} className={w.location === 'camp' ? 'text-blue-400' : 'text-orange-400'} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <PhaseChip phase={w.seasonPhase} />
                    </td>
                    <td className="px-4 py-2.5">
                      <VolBar value={w.volume} color="#22c55e" />
                    </td>
                    <td className="px-4 py-2.5">
                      <VolBar value={w.intensity} color="#3b82f6" />
                    </td>
                    {planMode === 'detailed' && <>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 font-mono">{w.sessions?.randori || '–'}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 font-mono">{w.sessions?.technical || '–'}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 font-mono">{w.sessions?.strengthCond || '–'}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 font-mono">{(w.sessions?.cardio ?? 0) || '–'}</td>
                    </>}
                    {athlete?.showWeightCycles && (
                      <td className="px-3 py-2.5 text-center">
                        {w.weightCycle && (
                          <span title={WEIGHT_CYCLE_LABELS[w.weightCycle]}
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                            style={{ backgroundColor: WEIGHT_CYCLE_COLORS[w.weightCycle] + '30', color: WEIGHT_CYCLE_COLORS[w.weightCycle] }}>
                            {WEIGHT_CYCLE_SHORT[w.weightCycle]}
                          </span>
                        )}
                      </td>
                    )}
                    {athlete?.showCardioCycles && (
                      <td className="px-3 py-2.5 text-center">
                        {w.cardioCycle && (
                          <span title={CARDIO_CYCLE_LABELS[w.cardioCycle]}
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                            style={{ backgroundColor: CARDIO_CYCLE_COLORS[w.cardioCycle] + '30', color: CARDIO_CYCLE_COLORS[w.cardioCycle] }}>
                            {CARDIO_CYCLE_SHORT[w.cardioCycle]}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {w.weekEvent && <EventBadge evt={w.weekEvent} />}
                        {w.weekendEvent && <EventBadge evt={w.weekendEvent} />}
                        {w.travelNote && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium bg-slate-100 border-slate-300 text-slate-500">
                            {w.travelNote === 'travel-before' ? 'Travel' : 'Travel/Recovery'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs">
                      {w.mandalaFocus && <div className="text-gray-700 font-medium truncate">{w.mandalaFocus}</div>}
                      {w.notes && <div className="text-gray-400 truncate mt-0.5">{w.notes}</div>}
                    </td>
                    <td className="px-2 py-2.5">
                      <Edit2 size={13} className="text-gray-300 hover:text-blue-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
