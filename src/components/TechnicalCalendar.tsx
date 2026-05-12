import { forwardRef, useMemo } from 'react'
import type { Week, TechnicalCycle } from '../types'
import {
  PHASE_COLORS,
  TECHNICAL_PHASE_LABELS,
  TECHNICAL_PHASE_COLORS,
  TECHNICAL_PHASE_SHORT,
} from '../types'
import { monthOf } from '../lib/dates'
import { RefreshCw } from 'lucide-react'

const COL = 44
const LABEL_W = 148

interface Props {
  weeks: Week[]
  cycles: TechnicalCycle[]
  onRegenerateCycles: () => void
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

const EMPHASIS_LABEL: Record<TechnicalCycle['sessionEmphasis'], string> = {
  'uchikomi': 'UCH',
  'nagekomi': 'NAG',
  'randori': 'RND',
  'tactical': 'TAC',
  'mixed': 'MIX',
}

const EMPHASIS_COLOR: Record<TechnicalCycle['sessionEmphasis'], string> = {
  'uchikomi': '#f97316',
  'nagekomi': '#3b82f6',
  'randori': '#ef4444',
  'tactical': '#8b5cf6',
  'mixed': '#10b981',
}

export const TechnicalCalendar = forwardRef<HTMLDivElement, Props>(function TechnicalCalendar(
  { weeks, cycles, onRegenerateCycles }, ref,
) {
  const groups = useMemo(() => groupByMonth(weeks), [weeks])
  const cycleByWeek = useMemo(() => {
    const m = new Map<number, TechnicalCycle>()
    for (const c of cycles) m.set(c.weekNumber, c)
    return m
  }, [cycles])

  const themeRowH = useMemo(() => {
    const maxLen = Math.max(0, ...cycles.map(c => c.theme.length))
    return Math.max(100, Math.min(180, maxLen * 7 + 20))
  }, [cycles])

  return (
    <div ref={ref}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.05rem',
            color: 'var(--bc-charcoal)', letterSpacing: '0.05em',
            margin: 0, textTransform: 'uppercase',
          }}>
            Technical Periodization Calendar
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--bc-muted)', margin: '0.2rem 0 0 0' }}>
            Weekly technical phase, theme, stance focus, and session emphasis.
          </p>
        </div>
        <button onClick={onRegenerateCycles}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.95rem', borderRadius: '0.5rem',
            fontSize: '0.78rem', fontWeight: 600,
            background: 'var(--bc-red)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}>
          <RefreshCw size={13} /> Regenerate Technical Plan
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto" style={{ background: '#fff', border: '1px solid var(--bc-border)', borderRadius: '0.75rem', padding: '0.75rem' }}>
        <div style={{ minWidth: `${weeks.length * COL + LABEL_W}px` }}>

          {/* Month headers */}
          <div style={{ display: 'flex', paddingLeft: LABEL_W }}>
            {groups.map(g => (
              <div key={g.month}
                style={{
                  width: g.weeks.length * COL,
                  color: 'var(--bc-muted)',
                  borderLeft: '1px solid var(--bc-border)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  paddingLeft: 4,
                  paddingTop: 4,
                  paddingBottom: 4,
                }}>
                {g.month.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Week numbers */}
          <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--bc-border)' }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
            }}>Week</div>
            {weeks.map(w => (
              <div key={w.weekNumber}
                style={{
                  width: COL, borderLeft: '1px solid var(--bc-border)',
                  textAlign: 'center', fontSize: '0.7rem',
                  fontFamily: 'monospace', color: '#a8a8a8',
                  padding: '0.15rem 0',
                }}>
                {w.weekNumber}
              </div>
            ))}
          </div>

          {/* Season Phase */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
            }}>Season Phase</div>
            {weeks.map(w => (
              <div key={w.weekNumber}
                style={{
                  width: COL, height: 22,
                  backgroundColor: PHASE_COLORS[w.seasonPhase],
                  borderLeft: '1px solid rgba(255,255,255,0.18)',
                }}
                title={`Week ${w.weekNumber}: ${w.seasonPhase}`}
              />
            ))}
          </div>

          {/* Technical Phase */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
            }}>Technical Phase</div>
            {weeks.map(w => {
              const c = cycleByWeek.get(w.weekNumber)
              const bg = c ? TECHNICAL_PHASE_COLORS[c.phase] : '#e8e3de'
              const short = c ? TECHNICAL_PHASE_SHORT[c.phase] : ''
              return (
                <div key={w.weekNumber}
                  title={c ? TECHNICAL_PHASE_LABELS[c.phase] : 'No cycle'}
                  style={{
                    width: COL, height: 22, backgroundColor: bg,
                    borderLeft: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                    fontFamily: 'monospace',
                  }}>
                  {short}
                </div>
              )
            })}
          </div>

          {/* Theme (vertical text) */}
          <div style={{ display: 'flex' }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
              height: themeRowH, display: 'flex',
              alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 6,
            }}>Theme</div>
            {weeks.map(w => {
              const c = cycleByWeek.get(w.weekNumber)
              return (
                <div key={w.weekNumber}
                  title={c?.theme}
                  style={{
                    width: COL, height: themeRowH, overflow: 'hidden',
                    borderLeft: '1px solid var(--bc-border)',
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                    paddingBottom: 6,
                  }}>
                  {c?.theme && (
                    <span style={{
                      writingMode: 'vertical-lr',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--bc-charcoal)',
                      lineHeight: 1,
                    }}>
                      {c.theme}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Stance Focus */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
            }}>Stance</div>
            {weeks.map(w => {
              const c = cycleByWeek.get(w.weekNumber)
              return (
                <div key={w.weekNumber}
                  title={c?.stanceFocus ? `Stance focus: ${c.stanceFocus}` : 'No stance focus'}
                  style={{
                    width: COL, height: 22,
                    borderLeft: '1px solid var(--bc-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    fontFamily: 'monospace',
                    color: c?.stanceFocus ? 'var(--bc-charcoal)' : '#bbb',
                    background: c?.stanceFocus ? 'var(--bc-snow)' : 'transparent',
                  }}>
                  {c?.stanceFocus ?? '—'}
                </div>
              )
            })}
          </div>

          {/* Session Emphasis */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <div style={{
              width: LABEL_W, fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--bc-muted)', textAlign: 'right', paddingRight: 8,
            }}>Emphasis</div>
            {weeks.map(w => {
              const c = cycleByWeek.get(w.weekNumber)
              const color = c ? EMPHASIS_COLOR[c.sessionEmphasis] : '#bbb'
              const label = c ? EMPHASIS_LABEL[c.sessionEmphasis] : ''
              return (
                <div key={w.weekNumber}
                  title={c?.sessionEmphasis}
                  style={{
                    width: COL, height: 22,
                    borderLeft: '1px solid var(--bc-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    fontFamily: 'monospace',
                    color: c ? color : '#bbb',
                    background: c ? color + '20' : 'transparent',
                  }}>
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '0.85rem', background: '#fff', border: '1px solid var(--bc-border)', borderRadius: '0.75rem', padding: '0.85rem 1rem' }}>
        <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--bc-charcoal)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem 0' }}>
          Phase Legend
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem 1.2rem', marginBottom: '0.85rem' }}>
          {(Object.entries(TECHNICAL_PHASE_LABELS) as [keyof typeof TECHNICAL_PHASE_COLORS, string][])
            .map(([p, label]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: 22, height: 14, borderRadius: 3,
                  background: TECHNICAL_PHASE_COLORS[p],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  fontFamily: 'monospace',
                }}>
                  {TECHNICAL_PHASE_SHORT[p]}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--bc-charcoal)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--bc-muted)' }}>
                  {p === 'acquisition' && '— exploring new technique, bilateral work'}
                  {p === 'consolidation' && '— building attack systems, combinations'}
                  {p === 'competition-integration' && '— tactical/stance-specific'}
                  {p === 'peak' && '— sharpening, match-speed, precision'}
                  {p === 'transition' && '— recovery, creativity, free play'}
                </span>
              </div>
            ))}
        </div>
        <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--bc-charcoal)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem 0' }}>
          Session Emphasis
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
          {(Object.keys(EMPHASIS_LABEL) as (keyof typeof EMPHASIS_LABEL)[]).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                padding: '0.15rem 0.45rem', borderRadius: 4,
                background: EMPHASIS_COLOR[k] + '20',
                color: EMPHASIS_COLOR[k],
                fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
              }}>{EMPHASIS_LABEL[k]}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--bc-charcoal)' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
