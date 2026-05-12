// ============================================================================
// Technical Periodization Logic
// ----------------------------------------------------------------------------
// Maps season phases (forge/sculpt/conversion/sharpening/battle/transition)
// onto Technical Phases (acquisition/consolidation/competition-integration/
// peak/transition) and generates weekly themes that drive judo session content.
// ============================================================================

import type {
  Week,
  AthleteTechnicalProfile,
  TechnicalCycle,
  TechnicalPhase,
} from '../types'
import { TECHNIQUE_MAP, TECHNIQUES } from './techniques'
import { parseISO, getMonth } from 'date-fns'

// ---------------------------------------------------------------------------
// Phase mapping
// ---------------------------------------------------------------------------

const PHASE_MAP: Record<Week['seasonPhase'], TechnicalPhase> = {
  forge: 'acquisition',
  sculpt: 'consolidation',
  conversion: 'competition-integration',
  sharpening: 'peak',
  battle: 'peak',
  transition: 'transition',
}

const STANCE_ROTATION: ('RR' | 'RL' | 'LL')[] = ['RR', 'RL', 'LL']

// ---------------------------------------------------------------------------
// Theme libraries — month-targeted to keep variety across a season
// ---------------------------------------------------------------------------

const ACQUISITION_THEMES = [
  'Foundational ashi-waza exploration',
  'Ko-uchi gari entries (bilateral)',
  'Sasae & sutemi base footwork',
  'Forward throws — hip rotation fundamentals',
  'O-uchi & ko-uchi setup webs',
  'Gripping system: sleeve-to-attack chain',
  'Counter-throw introduction',
  'Drop-style seoi entries',
  'Connecting tachi-waza to ne-waza',
  'Uchi-mata mechanics — bilateral work',
]

const CONSOLIDATION_THEMES = [
  'Combination month — ko-uchi → seoi family',
  'Combination month — o-uchi → forward family',
  'Building the attack system (tokui-waza variations)',
  'Same-side combinations',
  'Opposite-stance attack templates',
  'Grip-to-attack sequence efficiency',
  'Counter system development',
  'Transition density — throw → pin chains',
  'Edge fighting compositions',
  'Gripping pressure & breaking patterns',
]

const COMP_INTEGRATION_THEMES = [
  'Competition simulation — RR situations',
  'Competition simulation — RL situations',
  'Golden-score scenarios (2 min sudden death)',
  'Match-start tactical pressure',
  'Shido pressure & negative-grip play',
  'Score-then-defend scenarios',
  'Edge pressure & out-of-bounds control',
  'First-attack tactical priming',
  'Penalty management & gripping discipline',
  'Tactical bracket simulation',
]

const PEAK_THEMES = [
  'Sharpening — tokui activation at speed',
  'Sharpening — combination tempo',
  'Sharpening — grip & first-attack',
  'Precision month — high-quality, low-volume',
  'Sharpening — transition velocity',
  'Sharpening — golden-score scenarios',
]

const TRANSITION_THEMES = [
  'Creative play — open randori themes',
  'Recovery & weak-side technique exposure',
  'Cross-training motor patterns',
  'Light technique review — broad menu',
  'Self-directed creative session',
  'Mobility & body literacy',
]

const TACTICAL_THEMES: Record<TechnicalPhase, string[]> = {
  'acquisition': [
    'Open mat — explore stances',
    'Two-step movement patterns',
    'Bilateral attack rhythm',
    'Distance management',
  ],
  'consolidation': [
    'Same-stance gripping templates',
    'Opposite-stance gripping templates',
    'Combination triggers',
    'Closing distance to attack',
    'Counter-attack windows',
  ],
  'competition-integration': [
    'RR specificity',
    'RL specificity',
    'LL specificity',
    'Edge pressure',
    'Golden score situations',
    'Match-start patterns',
    'Shido pressure simulation',
  ],
  'peak': [
    'Match-speed grip war',
    'Score-and-defend (30s)',
    'Tokui activation pressure',
    'Final 30-second scenarios',
  ],
  'transition': [
    'Free play — no constraint',
    'Weak-side exploration',
    'Self-directed scenarios',
  ],
}

const GRIPPING_THEMES = [
  'Sleeve-lapel default sequence',
  'Cross-grip system',
  'High-collar pressure',
  'Pistol-grip control',
  'Pocket-grip & belt control',
  'Breaking the dominant grip',
  'Two-on-one sleeve battle',
  'Underhook & body-lock entries',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCompetitionWeek(w: Week): boolean {
  return !!(w.weekEvent || w.weekendEvent)
}

function isTransitionWeek(w: Week): boolean {
  return w.seasonPhase === 'transition' || w.location === 'travel'
}

function weeksToNextCompetition(weeks: Week[], fromIndex: number): number {
  for (let i = fromIndex; i < weeks.length; i++) {
    if (isCompetitionWeek(weeks[i])) return i - fromIndex
  }
  return Infinity
}

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length]
}

function classifyAttackDirection(
  techniqueIds: string[],
): { forward: boolean; backward: boolean; ashi: boolean } {
  const out = { forward: false, backward: false, ashi: false }
  for (const id of techniqueIds) {
    const t = TECHNIQUE_MAP.get(id)
    if (!t) continue
    if (t.direction === 'forward') out.forward = true
    if (t.direction === 'backward') out.backward = true
    if (t.type === 'ashi-waza') out.ashi = true
  }
  return out
}

// Choose acquisition targets from the global database, biased away from athlete's
// existing tokui (we're trying to BROADEN their menu in acquisition phase).
function pickAcquisitionTargets(
  profile: AthleteTechnicalProfile | undefined,
  weekIdx: number,
): string[] {
  const known = new Set<string>([
    ...(profile?.tokui ?? []),
    ...(profile?.secondary ?? []),
  ])
  const candidates = TECHNIQUES.filter(t => !known.has(t.id) && t.complexityLevel <= 2)
  if (candidates.length === 0) return []
  // Take 2 candidates spaced through the list so we rotate.
  const a = pick(candidates, weekIdx * 2)
  const b = pick(candidates, weekIdx * 2 + 1)
  return Array.from(new Set([a.id, b.id]))
}

// Review targets — pull from secondary techniques (we're polishing them).
function pickReviewTargets(
  profile: AthleteTechnicalProfile | undefined,
  weekIdx: number,
): string[] {
  const pool = profile?.secondary ?? []
  if (pool.length === 0) {
    // Default review pool — broadly useful intermediates.
    const defaults = ['ko-uchi-gari', 'o-uchi-gari', 'sasae-tsuri-komi-ashi', 'tai-otoshi', 'harai-goshi']
    return [pick(defaults, weekIdx), pick(defaults, weekIdx + 2)]
  }
  if (pool.length <= 2) return pool.slice()
  return [pick(pool, weekIdx), pick(pool, weekIdx + 1)]
}

// Integrated — athlete's tokui (or sensible defaults).
function pickIntegrated(profile: AthleteTechnicalProfile | undefined): string[] {
  if (profile?.tokui && profile.tokui.length > 0) return profile.tokui.slice(0, 4)
  return ['ko-uchi-gari', 'uchi-mata', 'morote-seoi-nage']
}

// Pick stance focus — competition-integration phase honors athlete preferred,
// otherwise rotate through the 3-week cycle.
function pickStance(
  phase: TechnicalPhase,
  weekIdx: number,
  profile: AthleteTechnicalProfile | undefined,
): 'RR' | 'RL' | 'LL' {
  const rotated = STANCE_ROTATION[weekIdx % STANCE_ROTATION.length]
  if (phase === 'peak') {
    // Lock to athlete's primary at peak.
    if (profile?.preferredStance === 'left') return 'LL'
    if (profile?.preferredStance === 'right') return 'RR'
    return rotated
  }
  return rotated
}

function pickSessionEmphasis(
  phase: TechnicalPhase,
  w: Week,
): TechnicalCycle['sessionEmphasis'] {
  if (isCompetitionWeek(w)) return 'tactical'
  switch (phase) {
    case 'acquisition':            return 'uchikomi'
    case 'consolidation':          return 'nagekomi'
    case 'competition-integration': return 'tactical'
    case 'peak':                   return 'randori'
    case 'transition':             return 'mixed'
  }
}

function monthThemeBoost(date: string, base: string): string {
  try {
    const m = getMonth(parseISO(date))
    // 0=Jan ... 11=Dec
    if (m === 8) return `September focus — gripping systems: ${base}`     // Sep
    if (m === 10) return `November focus — combination month: ${base}`    // Nov
    if (m === 1) return `February focus — counter-attack: ${base}`        // Feb
    if (m === 4) return `May focus — match simulation: ${base}`           // May
    return base
  } catch {
    return base
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateTechnicalCycles(
  weeks: Week[],
  profile: AthleteTechnicalProfile | undefined,
): TechnicalCycle[] {
  const cycles: TechnicalCycle[] = []

  weeks.forEach((w, idx) => {
    let phase: TechnicalPhase = PHASE_MAP[w.seasonPhase]

    // Near-competition override — within 2 weeks, push toward peak.
    const distance = weeksToNextCompetition(weeks, idx)
    if (distance <= 2 && phase !== 'transition' && phase !== 'peak') {
      phase = 'competition-integration'
    }
    if (distance === 0 || distance === 1) {
      phase = 'peak'
    }

    // Transition / travel weeks always reset to transition mode.
    if (isTransitionWeek(w)) phase = 'transition'

    const stanceFocus = pickStance(phase, idx, profile)

    // Pick targets — competition weeks reduce/clear acquisition.
    const compWeek = isCompetitionWeek(w)
    const acquisitionTargets = (phase === 'transition' || compWeek)
      ? []
      : phase === 'peak'
        ? []
        : pickAcquisitionTargets(profile, idx)
    const reviewTargets = (phase === 'transition' || compWeek)
      ? []
      : pickReviewTargets(profile, idx)
    const integratedTechniques = pickIntegrated(profile)

    // Base theme
    let baseTheme = ''
    switch (phase) {
      case 'acquisition':            baseTheme = pick(ACQUISITION_THEMES, idx); break
      case 'consolidation':          baseTheme = pick(CONSOLIDATION_THEMES, idx); break
      case 'competition-integration': baseTheme = pick(COMP_INTEGRATION_THEMES, idx); break
      case 'peak':                   baseTheme = pick(PEAK_THEMES, idx); break
      case 'transition':             baseTheme = pick(TRANSITION_THEMES, idx); break
    }
    const theme = monthThemeBoost(w.startDate, baseTheme)

    // Tactical theme
    const tactPool = TACTICAL_THEMES[phase]
    const tacticalTheme = compWeek
      ? `Competition tactics — ${pick(tactPool, idx)}`
      : pick(tactPool, idx)

    // Gripping theme — only emphasized during certain months/phases.
    const grippingTheme = phase === 'transition'
      ? undefined
      : pick(GRIPPING_THEMES, idx)

    cycles.push({
      weekNumber: w.weekNumber,
      phase,
      theme,
      tacticalTheme,
      grippingTheme,
      stanceFocus,
      acquisitionTargets,
      reviewTargets,
      integratedTechniques,
      sessionEmphasis: pickSessionEmphasis(phase, w),
      intensity: w.intensity,
      volume: w.volume,
    })
  })

  // Profile-aware adjustment — if athlete is heavy ashi-waza preference,
  // bias themes that mention ashi techniques toward their classification.
  if (profile?.ashiWazaPreference) {
    // No-op for now; reserved for richer rebalancing in future iterations.
    // The tag is read elsewhere when picking drills.
    void classifyAttackDirection(integratedFlat(cycles))
  }

  return cycles
}

function integratedFlat(cycles: TechnicalCycle[]): string[] {
  const set = new Set<string>()
  for (const c of cycles) for (const t of c.integratedTechniques) set.add(t)
  return Array.from(set)
}
