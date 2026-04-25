import { forwardRef, useMemo } from 'react'
import type { Week, Athlete } from '../types'
import { PHASE_COLORS, IMPORTANCE_STARS,
  WEIGHT_CYCLE_LABELS, WEIGHT_CYCLE_SHORT, WEIGHT_CYCLE_COLORS,
  CARDIO_CYCLE_LABELS, CARDIO_CYCLE_SHORT, CARDIO_CYCLE_COLORS } from '../types'
import { monthOf } from '../lib/dates'

const COL = 44  // px per week column
const LABEL_W = 148

interface Props {
  weeks: Week[]
  planMode: 'simple' | 'detailed'
  onEditWeek: (weekNumber: number) => void
  athlete?: Athlete
}

function groupByMonth(weeks: Week[]) {
  const groups: { month: string; weeks: Week[] }[] = []
  for (const w of weeks) {
    const m = monthOf(w.startDate)
    const last = groups[groups.length - 1]
    if (last && last.month === m) last.weeks.push(w)
    else groups.push({ month: m, weeks: [w] })
  }
  return groups
}

const BAR_H = 136
const LABEL_H = 14
const SQ_GAP = 2

function BarScale({ level, color }: { level: number; color: string }) {
  return (
    <div style={{ height: BAR_H + LABEL_H, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SQ_GAP, padding: '2px 3px 0 3px' }}>
        {[5, 4, 3, 2, 1].map(n => (
          <div key={n} style={{
            flex: 1,
            backgroundColor: n <= level ? color : '#e5e7eb',
            borderRadius: 2,
          }} />
        ))}
      </div>
      <div style={{
        height: LABEL_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: '#4b5563',
      }}>
        {level}
      </div>
    </div>
  )
}

export const YearGrid = forwardRef<HTMLDivElement, Props>(function YearGrid(
  { weeks, planMode, onEditWeek, athlete }, ref
) {
  const groups = useMemo(() => groupByMonth(weeks), [weeks])

  const eventRowH = useMemo(() => {
    const maxLen = Math.max(
      0,
      ...weeks.map(w => {
        const evt = w.weekendEvent ?? w.weekEvent
        return (evt?.name ?? (w.physicalTestingProposed ? 'Testing' : '')).length
      })
    )
    return Math.max(80, maxLen * 11 + 16)
  }, [weeks])

  return (
    <div className="overflow-x-auto" ref={ref}>
      <div style={{ minWidth: `${weeks.length * COL + LABEL_W}px` }}>

        {/* Month headers */}
        <div className="flex" style={{ paddingLeft: LABEL_W }}>
          {groups.map(g => (
            <div key={g.month}
              style={{ width: g.weeks.length * COL }}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-200 pl-1 py-1">
              {g.month.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Week numbers */}
        <div className="flex items-center border-t border-gray-200">
          <div className="shrink-0 text-xs text-gray-400 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Week</div>
          {weeks.map(w => (
            <div key={w.weekNumber} style={{ width: COL }}
              className="text-center text-xs text-gray-400 border-l border-gray-100 py-0.5 font-mono">
              {w.weekNumber}
            </div>
          ))}
        </div>

        {/* Phase */}
        <div className="flex items-center">
          <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Phase</div>
          {weeks.map(w => (
            <button key={w.weekNumber}
              onClick={() => onEditWeek(w.weekNumber)}
              style={{ width: COL, backgroundColor: PHASE_COLORS[w.seasonPhase] }}
              title={`Week ${w.weekNumber}: ${w.seasonPhase}`}
              className="h-6 border-l border-white/20 hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </div>

        {/* Events — colored background + vertical name */}
        <div className="flex">
          <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right"
            style={{ width: LABEL_W, height: eventRowH, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            Events
          </div>
          {weeks.map(w => {
            const evt = w.weekendEvent ?? w.weekEvent
            const bgColor = evt
              ? evt.type === 'target' ? '#ef4444'
                : evt.type === 'medium' ? '#f97316'
                : evt.type === 'camp' ? '#3b82f6'
                : '#f59e0b'
              : w.physicalTestingProposed ? '#0891b2'
              : 'transparent'
            const label = evt?.name ?? (w.physicalTestingProposed ? 'Testing' : null)
            const textColor = evt?.type === 'development' ? '#1f2937' : 'white'
            return (
              <div key={w.weekNumber}
                title={evt ? `${evt.name} ${IMPORTANCE_STARS[evt.importance - 1]}` : undefined}
                style={{ width: COL, height: eventRowH, backgroundColor: bgColor, overflow: 'hidden',
                         display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 4 }}
                className="border-l border-gray-200">
                {label && (
                  <span style={{
                    writingMode: 'vertical-lr',
                    transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                    fontWeight: 700,
                    color: textColor,
                    lineHeight: 1,
                  }}>
                    {label}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Travel */}
        {weeks.some(w => w.travelNote) && (
          <div className="flex items-center">
            <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Travel</div>
            {weeks.map(w => (
              <div key={w.weekNumber} style={{ width: COL }}
                className="h-6 border-l border-gray-100 flex items-center justify-center">
                {w.travelNote && (
                  <div
                    title={w.travelNote === 'travel-before' ? 'Travel to event' : 'Travel/Recovery'}
                    className="rounded-sm flex items-center justify-center text-white font-bold"
                    style={{ width: COL - 6, height: 14, backgroundColor: '#94a3b8', fontSize: 7 }}>
                    {w.travelNote === 'travel-before' ? 'Travel' : 'Return'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Volume */}
        <div className="flex items-stretch mt-1">
          <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right flex items-center" style={{ width: LABEL_W }}>Volume</div>
          {weeks.map(w => (
            <div key={w.weekNumber} style={{ width: COL }}>
              <BarScale level={w.volume} color="#22c55e" />
            </div>
          ))}
        </div>

        {/* Intensity */}
        <div className="flex items-stretch">
          <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right flex items-center" style={{ width: LABEL_W }}>Intensity</div>
          {weeks.map(w => (
            <div key={w.weekNumber} style={{ width: COL }}>
              <BarScale level={w.intensity} color="#3b82f6" />
            </div>
          ))}
        </div>

        {/* Session counts (Detailed mode) */}
        {planMode === 'detailed' && (
          <>
            {(['randori', 'technical', 'strengthCond'] as const).map((key, i) => {
              const labels = ['Randori', 'Technical', 'S&C']
              return (
                <div key={key} className="flex items-center">
                  <div className="shrink-0 text-xs text-gray-400 font-medium pr-2 text-right" style={{ width: LABEL_W }}>{labels[i]}</div>
                  {weeks.map(w => (
                    <div key={w.weekNumber} style={{ width: COL }}
                      className="h-6 border-l border-gray-100 flex items-center justify-center text-xs text-gray-500 font-mono">
                      {w.sessions?.[key] || ''}
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="flex items-center">
              <div className="shrink-0 text-xs text-gray-400 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Testing</div>
              {weeks.map(w => (
                <div key={w.weekNumber} style={{ width: COL }}
                  className="h-6 border-l border-gray-100 flex items-center justify-center text-xs font-bold text-cyan-600">
                  {(w.sessions?.physicalTesting || w.physicalTestingProposed) ? 'T' : ''}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cycle (Detailed mode) */}
        {planMode === 'detailed' && (
          <div className="flex items-center mt-1">
            <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Cycle</div>
            {weeks.map(w => {
              const cycleColors: Record<string, string> = {
                DEV1: '#22c55e', DEV2: '#84cc16', SHARPENING: '#a855f7', REST: '#6b7280', COMPETITION: '#ef4444',
              }
              return (
                <div key={w.weekNumber} style={{ width: COL, backgroundColor: w.cycle ? cycleColors[w.cycle] + '33' : 'transparent' }}
                  className="h-6 border-l border-gray-100 flex items-center justify-center">
                  {w.cycle && (
                    <span className="font-mono" style={{ fontSize: 7, color: cycleColors[w.cycle] }}>
                      {w.cycle.slice(0, 3)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Weight Cycles */}
        {athlete?.showWeightCycles && (
          <div className="flex items-center mt-1">
            <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Weight</div>
            {weeks.map(w => (
              <div key={w.weekNumber}
                title={w.weightCycle ? WEIGHT_CYCLE_LABELS[w.weightCycle] : undefined}
                style={{ width: COL, backgroundColor: w.weightCycle ? WEIGHT_CYCLE_COLORS[w.weightCycle] + '40' : 'transparent' }}
                className="h-6 border-l border-gray-100 flex items-center justify-center">
                {w.weightCycle && (
                  <span className="font-mono font-bold" style={{ fontSize: 7, color: WEIGHT_CYCLE_COLORS[w.weightCycle] }}>
                    {WEIGHT_CYCLE_SHORT[w.weightCycle]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cardio Cycles */}
        {athlete?.showCardioCycles && (
          <div className="flex items-center">
            <div className="shrink-0 text-xs text-gray-500 font-medium pr-2 text-right" style={{ width: LABEL_W }}>Cardio</div>
            {weeks.map(w => (
              <div key={w.weekNumber}
                title={w.cardioCycle ? CARDIO_CYCLE_LABELS[w.cardioCycle] : undefined}
                style={{ width: COL, backgroundColor: w.cardioCycle ? CARDIO_CYCLE_COLORS[w.cardioCycle] + '40' : 'transparent' }}
                className="h-6 border-l border-gray-100 flex items-center justify-center">
                {w.cardioCycle && (
                  <span className="font-mono font-bold" style={{ fontSize: 7, color: CARDIO_CYCLE_COLORS[w.cardioCycle] }}>
                    {CARDIO_CYCLE_SHORT[w.cardioCycle]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3" style={{ paddingLeft: LABEL_W }}>
          Click any phase cell to edit a week · <span className="text-cyan-600 font-medium">T</span> = physical testing · <span className="font-medium" style={{ color: '#94a3b8' }}>Travel/Return</span> = travel days
        </p>
      </div>
    </div>
  )
})
