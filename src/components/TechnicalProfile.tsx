import { useState, useMemo } from 'react'
import { Plus, X, Search } from 'lucide-react'
import type {
  AthleteTechnicalProfile,
  TechniqueInSystem,
  CombinationChain,
  NeWazaChain,
  DevelopmentLevel,
  GripStyle,
  CounterFightingStyle,
  TransitionPreference,
  NeWazaStrength,
} from '../types'
import {
  DEVELOPMENT_LEVEL_LABELS,
  GRIP_STYLE_LABELS,
} from '../types'
import { TECHNIQUES, techniqueLabel } from '../lib/techniques'

// ---------------------------------------------------------------------------
// Tab styles — BC branding
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--bc-border)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--bc-muted)',
  marginBottom: '0.4rem',
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--bc-border)',
  borderRadius: '0.5rem',
  padding: '0.55rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  background: '#fff',
  color: 'var(--bc-text)',
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem 0.5rem 0 0',
  fontSize: '0.8rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  background: active ? 'var(--bc-charcoal)' : 'transparent',
  color: active ? '#fff' : 'var(--bc-muted)',
  border: 'none',
  borderBottom: active ? '3px solid var(--bc-red)' : '3px solid transparent',
  transition: 'all 0.15s',
})

const chipStyle = (selected: boolean): React.CSSProperties => ({
  padding: '0.35rem 0.7rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: selected ? 'var(--bc-red)' : '#fff',
  color: selected ? '#fff' : 'var(--bc-charcoal)',
  border: `1px solid ${selected ? 'var(--bc-red)' : 'var(--bc-border)'}`,
  cursor: 'pointer',
  transition: 'all 0.12s',
})

const pillButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.45rem 0.85rem',
  borderRadius: '0.5rem',
  fontSize: '0.78rem',
  fontWeight: 600,
  background: active ? 'var(--bc-charcoal)' : '#fff',
  color: active ? '#fff' : 'var(--bc-charcoal)',
  border: `1px solid ${active ? 'var(--bc-charcoal)' : 'var(--bc-border)'}`,
  cursor: 'pointer',
  transition: 'all 0.12s',
})

// ---------------------------------------------------------------------------
// Technique autocomplete
// ---------------------------------------------------------------------------

function TechniqueAutocomplete({
  value,
  onAdd,
  exclude = [],
  placeholder = 'Search techniques…',
}: {
  value: string[]
  onAdd: (id: string) => void
  exclude?: string[]
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return TECHNIQUES
      .filter(t =>
        !value.includes(t.id) &&
        !exclude.includes(t.id) &&
        (t.name.toLowerCase().includes(q) || t.id.includes(q) || t.japaneseName.includes(query)),
      )
      .slice(0, 8)
  }, [query, value, exclude])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-muted)' }} />
        <input
          style={{ ...inputStyle, paddingLeft: '2rem' }}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          marginTop: '0.25rem', background: '#fff',
          border: '1px solid var(--bc-border)', borderRadius: '0.5rem',
          boxShadow: '0 6px 14px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {results.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onAdd(t.id); setQuery('') }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: '1px solid var(--bc-border)',
                color: 'var(--bc-text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bc-snow)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 600 }}>{t.name}</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--bc-muted)', fontSize: '0.7rem' }}>
                {t.type} · {t.japaneseName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChipList({
  values, onRemove,
}: { values: string[]; onRemove: (id: string) => void }) {
  if (values.length === 0) {
    return <p style={{ fontSize: '0.78rem', color: 'var(--bc-muted)', fontStyle: 'italic' }}>None selected yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {values.map(id => (
        <span key={id} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.3rem 0.6rem', borderRadius: '999px',
          background: 'var(--bc-snow)', border: '1px solid var(--bc-border)',
          fontSize: '0.78rem', color: 'var(--bc-charcoal)',
        }}>
          {techniqueLabel(id)}
          <button
            type="button" onClick={() => onRemove(id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--bc-muted)' }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  profile: AthleteTechnicalProfile
  onChange: (p: AthleteTechnicalProfile) => void
}

export function TechnicalProfile({ profile, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<'identity' | 'system'>('identity')

  function patch<K extends keyof AthleteTechnicalProfile>(key: K, val: AthleteTechnicalProfile[K]) {
    onChange({ ...profile, [key]: val })
  }

  function patchSystem(updater: (prev: NonNullable<AthleteTechnicalProfile['technicalSystem']>) => NonNullable<AthleteTechnicalProfile['technicalSystem']>) {
    const base = profile.technicalSystem ?? { techniques: [], combinations: [], gripSequences: [], neWazaChains: [] }
    onChange({ ...profile, technicalSystem: updater(base) })
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--bc-border)', marginBottom: '1.25rem' }}>
        <button style={tabStyle(activeTab === 'identity')} onClick={() => setActiveTab('identity')}>
          Identity
        </button>
        <button style={tabStyle(activeTab === 'system')} onClick={() => setActiveTab('system')}>
          Attack System
        </button>
      </div>

      {activeTab === 'identity'
        ? <IdentityTab profile={profile} patch={patch} />
        : <SystemTab profile={profile} patchSystem={patchSystem} />
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// Identity Tab
// ---------------------------------------------------------------------------

function IdentityTab({
  profile,
  patch,
}: {
  profile: AthleteTechnicalProfile
  patch: <K extends keyof AthleteTechnicalProfile>(k: K, v: AthleteTechnicalProfile[K]) => void
}) {
  const developmentLevels: DevelopmentLevel[] = ['beginner', 'development', 'provincial', 'national', 'international', 'elite']
  const gripStyles: GripStyle[] = ['sleeve-lapel', 'cross-grip', 'high-collar', 'pistol', 'pocket', 'belt']
  const counterStyles: CounterFightingStyle[] = ['proactive', 'reactive', 'mixed']
  const transitionPrefs: TransitionPreference[] = ['standing-to-ground', 'ground-to-standing', 'mixed']
  const neStrengths: NeWazaStrength[] = ['strong', 'moderate', 'weak']

  function toggleGripStyle(g: GripStyle) {
    const cur = new Set(profile.gripStyle ?? [])
    if (cur.has(g)) cur.delete(g); else cur.add(g)
    patch('gripStyle', Array.from(cur))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Personal info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Personal Info
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input style={inputStyle} value={profile.firstName ?? ''} onChange={e => patch('firstName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input style={inputStyle} value={profile.lastName ?? ''} onChange={e => patch('lastName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Birth Year</label>
            <input type="number" style={inputStyle}
              value={profile.birthYear ?? ''}
              onChange={e => patch('birthYear', Number(e.target.value) || undefined)} />
          </div>
          <div>
            <label style={labelStyle}>Weight Category</label>
            <input style={inputStyle} value={profile.weightCategory ?? ''} onChange={e => patch('weightCategory', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Belt Rank</label>
            <input style={inputStyle} value={profile.beltRank ?? ''} onChange={e => patch('beltRank', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Club</label>
            <input style={inputStyle} value={profile.club ?? ''} onChange={e => patch('club', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Coach</label>
            <input style={inputStyle} value={profile.coach ?? ''} onChange={e => patch('coach', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Development */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Development
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Development Level</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {developmentLevels.map(l => (
              <button key={l} type="button"
                style={pillButtonStyle(profile.developmentLevel === l)}
                onClick={() => patch('developmentLevel', l)}>
                {DEVELOPMENT_LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle}>Years of Judo</label>
            <input type="number" style={inputStyle}
              value={profile.yearsOfJudo ?? ''}
              onChange={e => patch('yearsOfJudo', Number(e.target.value) || undefined)} />
          </div>
          <div>
            <label style={labelStyle}>Years Competing</label>
            <input type="number" style={inputStyle}
              value={profile.yearsOfCompetition ?? ''}
              onChange={e => patch('yearsOfCompetition', Number(e.target.value) || undefined)} />
          </div>
          <div>
            <label style={labelStyle}>Training Frequency (per week)</label>
            <input type="number" style={inputStyle}
              value={profile.trainingFrequencyPerWeek ?? ''}
              onChange={e => patch('trainingFrequencyPerWeek', Number(e.target.value) || undefined)} />
          </div>
          <div>
            <label style={labelStyle}>Avg Judo Sessions / Week</label>
            <input type="number" style={inputStyle}
              value={profile.averageWeeklyJudoSessions ?? ''}
              onChange={e => patch('averageWeeklyJudoSessions', Number(e.target.value) || undefined)} />
          </div>
        </div>
      </div>

      {/* Technical identity */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Technical Identity
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Preferred Stance</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['right', 'left', 'ambidextrous'] as const).map(s => (
              <button key={s} type="button"
                style={pillButtonStyle(profile.preferredStance === s)}
                onClick={() => patch('preferredStance', s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Grip Style (multi-select)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {gripStyles.map(g => (
              <button key={g} type="button"
                style={chipStyle((profile.gripStyle ?? []).includes(g))}
                onClick={() => toggleGripStyle(g)}>
                {GRIP_STYLE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Counter Fighting Style</label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {counterStyles.map(s => (
                <button key={s} type="button"
                  style={pillButtonStyle(profile.counterFightingStyle === s)}
                  onClick={() => patch('counterFightingStyle', s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Transition Preference</label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {transitionPrefs.map(s => (
                <button key={s} type="button"
                  style={pillButtonStyle(profile.transitionPreference === s)}
                  onClick={() => patch('transitionPreference', s)}>
                  {s.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Ne-Waza Strength</label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {neStrengths.map(s => (
                <button key={s} type="button"
                  style={pillButtonStyle(profile.neWazaStrength === s)}
                  onClick={() => patch('neWazaStrength', s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox"
              checked={profile.ashiWazaPreference ?? false}
              onChange={e => patch('ashiWazaPreference', e.target.checked)} />
            <span style={{ fontSize: '0.85rem', color: 'var(--bc-charcoal)', fontWeight: 600 }}>
              Ashi-Waza Specialist
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Tokui-Waza (primary weapons)</label>
          <ChipList values={profile.tokui ?? []} onRemove={id => patch('tokui', (profile.tokui ?? []).filter(x => x !== id))} />
          <div style={{ marginTop: '0.5rem' }}>
            <TechniqueAutocomplete
              value={profile.tokui ?? []}
              exclude={profile.secondary ?? []}
              placeholder="Add tokui technique…"
              onAdd={id => patch('tokui', [...(profile.tokui ?? []), id])}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Secondary Techniques</label>
          <ChipList values={profile.secondary ?? []} onRemove={id => patch('secondary', (profile.secondary ?? []).filter(x => x !== id))} />
          <div style={{ marginTop: '0.5rem' }}>
            <TechniqueAutocomplete
              value={profile.secondary ?? []}
              exclude={profile.tokui ?? []}
              placeholder="Add secondary technique…"
              onAdd={id => patch('secondary', [...(profile.secondary ?? []), id])}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// System Tab
// ---------------------------------------------------------------------------

function SystemTab({
  profile,
  patchSystem,
}: {
  profile: AthleteTechnicalProfile
  patchSystem: (u: (prev: NonNullable<AthleteTechnicalProfile['technicalSystem']>) => NonNullable<AthleteTechnicalProfile['technicalSystem']>) => void
}) {
  const system = profile.technicalSystem ?? { techniques: [], combinations: [], gripSequences: [], neWazaChains: [] }
  const [newTechId, setNewTechId] = useState('')
  const [newTechRole, setNewTechRole] = useState<TechniqueInSystem['role']>('primary')
  const [newComboSetup, setNewComboSetup] = useState('')
  const [newComboFinish, setNewComboFinish] = useState('')

  const roleOptions: TechniqueInSystem['role'][] = ['primary', 'secondary', 'combination', 'counter', 'transition', 'ne-waza']

  function addTechnique() {
    if (!newTechId) return
    patchSystem(prev => ({
      ...prev,
      techniques: [...prev.techniques, { techniqueId: newTechId, role: newTechRole }],
    }))
    setNewTechId('')
  }
  function removeTechnique(i: number) {
    patchSystem(prev => ({ ...prev, techniques: prev.techniques.filter((_, idx) => idx !== i) }))
  }
  function updateTechniqueStance(i: number, stance: 'RR' | 'RL' | 'LL' | undefined) {
    patchSystem(prev => ({
      ...prev,
      techniques: prev.techniques.map((t, idx) => idx === i ? { ...t, stanceFocus: stance } : t),
    }))
  }

  function addCombination() {
    if (!newComboSetup || !newComboFinish) return
    const chain: CombinationChain = {
      id: crypto.randomUUID(),
      setup: newComboSetup,
      finish: newComboFinish,
    }
    patchSystem(prev => ({ ...prev, combinations: [...prev.combinations, chain] }))
    setNewComboSetup(''); setNewComboFinish('')
  }
  function removeCombination(id: string) {
    patchSystem(prev => ({ ...prev, combinations: prev.combinations.filter(c => c.id !== id) }))
  }

  function addNeWazaChain() {
    const chain: NeWazaChain = { id: crypto.randomUUID(), entry: '', submissions: [] }
    patchSystem(prev => ({ ...prev, neWazaChains: [...prev.neWazaChains, chain] }))
  }
  function updateNeWazaChain(id: string, patch: Partial<NeWazaChain>) {
    patchSystem(prev => ({
      ...prev,
      neWazaChains: prev.neWazaChains.map(c => c.id === id ? { ...c, ...patch } : c),
    }))
  }
  function removeNeWazaChain(id: string) {
    patchSystem(prev => ({ ...prev, neWazaChains: prev.neWazaChains.filter(c => c.id !== id) }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Techniques table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Techniques in System ({system.techniques.length})
        </h3>

        {system.techniques.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--bc-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No techniques registered yet. Add the techniques the athlete actively trains.
          </p>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bc-snow)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--bc-muted)' }}>Technique</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--bc-muted)' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--bc-muted)' }}>Stance</th>
                  <th style={{ padding: '0.5rem 0.75rem' }} />
                </tr>
              </thead>
              <tbody>
                {system.techniques.map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--bc-border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--bc-charcoal)' }}>
                      {techniqueLabel(t.techniqueId)}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '999px',
                        fontSize: '0.7rem', fontWeight: 600,
                        background: 'var(--bc-snow)', color: 'var(--bc-charcoal)',
                      }}>
                        {t.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {(['RR', 'RL', 'LL'] as const).map(s => (
                          <button key={s} type="button"
                            style={{
                              padding: '0.2rem 0.45rem', borderRadius: '0.35rem',
                              fontSize: '0.7rem', fontWeight: 700,
                              background: t.stanceFocus === s ? 'var(--bc-charcoal)' : '#fff',
                              color: t.stanceFocus === s ? '#fff' : 'var(--bc-muted)',
                              border: '1px solid var(--bc-border)', cursor: 'pointer',
                            }}
                            onClick={() => updateTechniqueStance(i, t.stanceFocus === s ? undefined : s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                      <button type="button" onClick={() => removeTechnique(i)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--bc-muted)' }}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add technique */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', minWidth: 200 }}>
            <label style={labelStyle}>Add Technique</label>
            <TechniqueAutocomplete
              value={system.techniques.map(t => t.techniqueId).concat(newTechId ? [newTechId] : [])}
              placeholder="Search…"
              onAdd={id => setNewTechId(id)}
            />
            {newTechId && (
              <p style={{ fontSize: '0.75rem', color: 'var(--bc-charcoal)', marginTop: '0.25rem', fontWeight: 600 }}>
                Selected: {techniqueLabel(newTechId)}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={{ ...inputStyle, minWidth: 140 }}
              value={newTechRole}
              onChange={e => setNewTechRole(e.target.value as TechniqueInSystem['role'])}>
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="button" onClick={addTechnique} disabled={!newTechId}
            style={{
              padding: '0.55rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.8rem', fontWeight: 600,
              background: newTechId ? 'var(--bc-red)' : 'var(--bc-border)',
              color: '#fff', border: 'none', cursor: newTechId ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Combinations */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Combination Chains ({system.combinations.length})
        </h3>
        {system.combinations.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--bc-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No combinations yet. Add setup → finish pairs.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {system.combinations.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
                background: 'var(--bc-snow)', border: '1px solid var(--bc-border)',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--bc-charcoal)' }}>{techniqueLabel(c.setup)}</span>
                <span style={{ color: 'var(--bc-red)', fontWeight: 700 }}>→</span>
                <span style={{ fontWeight: 600, color: 'var(--bc-charcoal)' }}>{techniqueLabel(c.finish)}</span>
                <button type="button" onClick={() => removeCombination(c.id)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--bc-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={labelStyle}>Setup Technique</label>
            <TechniqueAutocomplete value={[]} placeholder="Search setup…" onAdd={setNewComboSetup} />
            {newComboSetup && (
              <p style={{ fontSize: '0.75rem', color: 'var(--bc-charcoal)', marginTop: '0.25rem', fontWeight: 600 }}>
                Setup: {techniqueLabel(newComboSetup)}
              </p>
            )}
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={labelStyle}>Finish Technique</label>
            <TechniqueAutocomplete value={[]} placeholder="Search finish…" onAdd={setNewComboFinish} />
            {newComboFinish && (
              <p style={{ fontSize: '0.75rem', color: 'var(--bc-charcoal)', marginTop: '0.25rem', fontWeight: 600 }}>
                Finish: {techniqueLabel(newComboFinish)}
              </p>
            )}
          </div>
          <button type="button" onClick={addCombination} disabled={!newComboSetup || !newComboFinish}
            style={{
              padding: '0.55rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.8rem', fontWeight: 600,
              background: newComboSetup && newComboFinish ? 'var(--bc-red)' : 'var(--bc-border)',
              color: '#fff', border: 'none',
              cursor: newComboSetup && newComboFinish ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
            <Plus size={14} /> Add Combo
          </button>
        </div>
      </div>

      {/* Ne-Waza Chains */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--bc-charcoal)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Ne-Waza Chains ({system.neWazaChains.length})
          </h3>
          <button type="button" onClick={addNeWazaChain}
            style={{
              padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
              fontSize: '0.75rem', fontWeight: 600,
              background: 'var(--bc-red)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
            <Plus size={13} /> Add Chain
          </button>
        </div>
        {system.neWazaChains.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--bc-muted)', fontStyle: 'italic' }}>
            No ne-waza chains yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {system.neWazaChains.map(chain => (
              <div key={chain.id} style={{
                padding: '0.75rem', borderRadius: '0.5rem',
                background: 'var(--bc-snow)', border: '1px solid var(--bc-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Entry Position / Technique</label>
                  <button type="button" onClick={() => removeNeWazaChain(chain.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--bc-muted)' }}>
                    <X size={13} />
                  </button>
                </div>
                <input style={{ ...inputStyle, marginBottom: '0.5rem' }}
                  placeholder="e.g. Turtle attack, juji entry from across-side…"
                  value={chain.entry}
                  onChange={e => updateNeWazaChain(chain.id, { entry: e.target.value })} />
                <label style={labelStyle}>Submission targets</label>
                <ChipList values={chain.submissions} onRemove={id =>
                  updateNeWazaChain(chain.id, { submissions: chain.submissions.filter(x => x !== id) })
                } />
                <div style={{ marginTop: '0.4rem' }}>
                  <TechniqueAutocomplete
                    value={chain.submissions}
                    placeholder="Add submission…"
                    onAdd={id => updateNeWazaChain(chain.id, { submissions: [...chain.submissions, id] })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
