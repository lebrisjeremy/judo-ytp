import { useState, useMemo } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Clock, Activity, Trash2, Dumbbell, Target } from 'lucide-react'
import type {
  JudoSession, JudoSessionBlock, Week, TechnicalCycle, AthleteTechnicalProfile,
} from '../types'
import { techniqueLabel } from '../lib/techniques'

interface Props {
  sessions: JudoSession[]
  weeks: Week[]
  cycles: TechnicalCycle[]
  planId: string
  profile: AthleteTechnicalProfile | undefined
  onGenerate: () => Promise<void>
  onDeleteSession: (id: string) => void
}

const loadColor = (n: number): string => {
  if (n >= 5) return '#ef4444'
  if (n === 4) return '#f97316'
  if (n === 3) return '#3b82f6'
  if (n === 2) return '#10b981'
  return '#94a3b8'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadPill({ label, value }: { label: string; value: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.55rem', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700,
      background: loadColor(value) + '18',
      color: loadColor(value),
      border: `1px solid ${loadColor(value)}40`,
    }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </span>
  )
}

function StanceBadge({ stance }: { stance: 'RR' | 'RL' | 'LL' }) {
  return (
    <span style={{
      padding: '0.25rem 0.55rem', borderRadius: '0.4rem',
      fontSize: '0.72rem', fontWeight: 700,
      background: 'var(--bc-charcoal)', color: '#fff',
      fontFamily: 'monospace', letterSpacing: '0.05em',
    }}>
      {stance}
    </span>
  )
}

function BlockCard({ block }: { block: JudoSessionBlock }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      border: '1px solid var(--bc-border)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.65rem 0.85rem', background: 'transparent', border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bc-snow)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: 4,
            background: 'var(--bc-snow)', color: 'var(--bc-muted)',
            fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700,
          }}>
            <Clock size={11} /> {block.duration}m
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)' }}>
            {block.title}
          </span>
          <LoadPill label="Int" value={block.intensity} />
        </div>
        {expanded ? <ChevronUp size={14} color="var(--bc-muted)" /> : <ChevronDown size={14} color="var(--bc-muted)" />}
      </button>
      {expanded && (
        <div style={{ padding: '0 0.85rem 0.85rem 0.85rem', borderTop: '1px solid var(--bc-border)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--bc-charcoal)', marginTop: '0.65rem' }}>
            {block.description}
          </p>
          {block.drills.length > 0 && (
            <div style={{ marginTop: '0.65rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--bc-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '0.3rem',
              }}>Drills</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {block.drills.map((d, i) => (
                  <li key={i} style={{ fontSize: '0.8rem', color: 'var(--bc-charcoal)', marginBottom: '0.2rem' }}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          {block.techniques.length > 0 && (
            <div style={{ marginTop: '0.65rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--bc-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '0.3rem',
              }}>Techniques</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {block.techniques.map(id => (
                  <span key={id} style={{
                    padding: '0.2rem 0.5rem', borderRadius: '999px',
                    background: 'var(--bc-snow)', border: '1px solid var(--bc-border)',
                    fontSize: '0.72rem', color: 'var(--bc-charcoal)', fontWeight: 600,
                  }}>{techniqueLabel(id)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onDelete }: { session: JudoSession; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--bc-border)',
      borderRadius: '0.85rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--bc-border)', background: 'var(--bc-snow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.95rem',
                color: 'var(--bc-charcoal)', letterSpacing: '0.04em',
              }}>
                Week {session.weekNumber} · Session {session.sessionNumber}
              </span>
              <StanceBadge stance={session.stanceFocus} />
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.2rem 0.5rem', borderRadius: 4,
                background: '#fff', border: '1px solid var(--bc-border)',
                color: 'var(--bc-muted)', fontSize: '0.7rem', fontFamily: 'monospace',
              }}>
                <Clock size={11} /> {session.totalDuration} min
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--bc-charcoal)', fontWeight: 600, margin: 0 }}>
              {session.objective}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--bc-muted)', margin: '0.25rem 0 0 0' }}>
              <Target size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {session.tacticalTheme}
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--bc-muted)', padding: '0.3rem',
              borderRadius: '0.35rem',
            }}
            title="Delete session"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
          <LoadPill label="Intensity" value={session.intensityLevel} />
          <LoadPill label="Technical" value={session.technicalLoad} />
          <LoadPill label="Tactical" value={session.tacticalLoad} />
        </div>
      </div>

      {/* Blocks */}
      <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <BlockCard block={session.warmup} />
        <BlockCard block={session.technicalSection} />
        <BlockCard block={session.tacticalDrills} />
        <BlockCard block={session.situationalRandori} />
        <BlockCard block={session.mainRandori} />
        <BlockCard block={session.neWaza} />
        <BlockCard block={session.cooldown} />
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.6rem 1rem', borderTop: '1px solid var(--bc-border)',
        background: 'var(--bc-snow)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.75rem', color: 'var(--bc-muted)',
      }}>
        <span><Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Total: <strong style={{ color: 'var(--bc-charcoal)' }}>{session.totalDuration} min</strong>
        </span>
        <span style={{ fontFamily: 'monospace' }}>
          generated {new Date(session.generatedAt).toLocaleDateString()}
        </span>
      </div>

      {confirmDelete && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #fecaca',
          background: '#fef2f2',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.78rem', color: '#991b1b', margin: 0 }}>Delete this session?</p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => { onDelete(); setConfirmDelete(false) }}
              style={{
                fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '0.35rem',
                background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>
              Delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{
                fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '0.35rem',
                background: '#fff', border: '1px solid var(--bc-border)', cursor: 'pointer', color: 'var(--bc-muted)',
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function JudoSessionsView({
  sessions, weeks, cycles: _cycles, planId: _planId, profile: _profile, onGenerate, onDeleteSession,
}: Props) {
  const [generating, setGenerating] = useState(false)

  const grouped = useMemo(() => {
    const byWeek = new Map<number, JudoSession[]>()
    for (const s of sessions) {
      const arr = byWeek.get(s.weekNumber) ?? []
      arr.push(s)
      byWeek.set(s.weekNumber, arr)
    }
    for (const [, arr] of byWeek) arr.sort((a, b) => a.sessionNumber - b.sessionNumber)
    return Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0])
  }, [sessions])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await onGenerate()
    } finally {
      setGenerating(false)
    }
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid var(--bc-border)',
        borderRadius: '1rem',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <Activity size={36} style={{ margin: '0 auto 0.85rem', color: 'var(--bc-muted)', opacity: 0.5 }} />
        <h3 style={{
          fontSize: '1.05rem', fontWeight: 700, color: 'var(--bc-charcoal)',
          margin: '0 0 0.5rem 0',
        }}>
          No Judo Sessions Generated Yet
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--bc-muted)', margin: '0 0 1.5rem 0', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Generate phase-aware judo sessions based on this plan's technical periodization.
          Each session contains a full 7-block structure: warm-up, technical, tactical, situational randori, main randori, ne-waza, and cooldown.
        </p>
        <button onClick={handleGenerate} disabled={generating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.4rem', borderRadius: '0.55rem',
            fontSize: '0.85rem', fontWeight: 700,
            background: 'var(--bc-red)', color: '#fff',
            border: 'none', cursor: generating ? 'wait' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}>
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Generate Judo Sessions'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top bar */}
      <div style={{
        background: '#fff', border: '1px solid var(--bc-border)',
        borderRadius: '0.85rem', padding: '0.85rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Dumbbell size={16} color="var(--bc-red)" />
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1rem',
              color: 'var(--bc-charcoal)', letterSpacing: '0.05em', textTransform: 'uppercase',
              margin: 0,
            }}>
              Judo Sessions
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--bc-muted)' }}>
              {sessions.length} session{sessions.length === 1 ? '' : 's'} · {grouped.length} week{grouped.length === 1 ? '' : 's'}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--bc-muted)', margin: '0.2rem 0 0 0' }}>
            Phase-aware sessions generated from this plan's technical periodization.
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1rem', borderRadius: '0.5rem',
            fontSize: '0.78rem', fontWeight: 600,
            background: 'var(--bc-red)', color: '#fff',
            border: 'none', cursor: generating ? 'wait' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}>
          <RefreshCw size={13} /> {generating ? 'Regenerating…' : 'Regenerate All'}
        </button>
      </div>

      {/* Grouped sessions */}
      {grouped.map(([weekNumber, weekSessions]) => {
        const w = weeks.find(x => x.weekNumber === weekNumber)
        return (
          <div key={weekNumber} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: 'var(--bc-charcoal)', color: '#fff',
              borderRadius: '0.5rem',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em' }}>
                WEEK {weekNumber}
              </span>
              {w && (
                <span style={{ fontSize: '0.72rem', color: '#aaa', fontFamily: 'monospace' }}>
                  {w.startDate} → {w.endDate}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#aaa' }}>
                {weekSessions.length} session{weekSessions.length === 1 ? '' : 's'}
              </span>
            </div>
            {weekSessions.map(s => (
              <SessionCard key={s.id} session={s} onDelete={() => onDeleteSession(s.id)} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
