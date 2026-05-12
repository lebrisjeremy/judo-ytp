// ============================================================================
// Judo Session Generator
// ----------------------------------------------------------------------------
// Generates phase-aware, judo-specific training sessions for every viable
// week in the plan (excluding competition weeks and travel/transition weeks
// when appropriate).
//
// Each JudoSession has 7 blocks:
//   1. Warm-Up
//   2. Technical Section
//   3. Tactical Drills
//   4. Situational Randori
//   5. Main Randori
//   6. Ne-Waza
//   7. Cooldown / Reflection
// ============================================================================

import type {
  Week,
  AthleteTechnicalProfile,
  TechnicalCycle,
  JudoSession,
  JudoSessionBlock,
  TechnicalPhase,
} from '../types'
import { TECHNIQUE_MAP, techniqueLabel } from './techniques'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp1to5(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n <= 1) return 1
  if (n >= 5) return 5
  return Math.round(n) as 1 | 2 | 3 | 4 | 5
}

function isCompetitionWeek(w: Week): boolean {
  return !!(w.weekEvent || w.weekendEvent)
}

function isTravelOrCampWeek(w: Week): boolean {
  return w.location === 'travel' || w.location === 'camp' || !!w.travelNote
}

function sessionsPerWeek(w: Week, cycle: TechnicalCycle): number {
  // 2 sessions baseline, 3 in high-volume / consolidation, 1 during transition/peak taper
  if (cycle.phase === 'transition') return 1
  if (isCompetitionWeek(w)) return 1
  if (cycle.volume >= 4) return 3
  if (cycle.volume <= 2) return 2
  return cycle.phase === 'consolidation' ? 3 : 2
}

function joinLabels(ids: string[], max = 3): string {
  const labels = ids.slice(0, max).map(techniqueLabel)
  return labels.join(', ') || '—'
}

function namedTokuiOrDefault(profile: AthleteTechnicalProfile | undefined): string {
  if (profile?.tokui && profile.tokui.length > 0) return techniqueLabel(profile.tokui[0])
  return 'tokui-waza'
}

// ---------------------------------------------------------------------------
// Block builders — phase-aware, judo-specific content
// ---------------------------------------------------------------------------

function buildWarmup(
  phase: TechnicalPhase,
  cycle: TechnicalCycle,
  _profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  switch (phase) {
    case 'acquisition':
      return {
        title: 'Warm-Up — Movement Literacy',
        duration: 15,
        description: 'General mobility, unsoku footwork patterns, ukemi progression (mae/yoko/ushiro). Light partner gripping at 30% pressure to wake up the kumikata system. Build into rhythmic uchikomi at half-speed.',
        drills: [
          'Unsoku footwork (5 min): tsugi-ashi forward/back, ayumi-ashi, lateral steps',
          'Ukemi circuit: 5 mae, 5 yoko/side, 5 ushiro',
          'Partner shadow gripping (30% pressure, 2 × 2 min)',
          'Rhythmic uchikomi build (3 × 10 reps each side, half-speed)',
        ],
        techniques: cycle.acquisitionTargets,
        intensity: 2,
      }
    case 'consolidation':
      return {
        title: 'Warm-Up — System Activation',
        duration: 15,
        description: 'Targeted mobility for the hip and shoulder. Gripping flow drill that funnels into the week\'s technical theme. Progressive uchikomi on integrated techniques to prime motor patterns.',
        drills: [
          'Hip openers + thoracic rotation (5 min)',
          'Gripping flow drill (3 min): sleeve → lapel → break → re-grip',
          'Uchikomi build: 3 × 10 reps on each integrated technique',
          'Movement uchikomi (moving partner, 2 × 30s/side)',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 2,
      }
    case 'competition-integration':
      return {
        title: 'Warm-Up — Specific Activation',
        duration: 15,
        description: 'Match-style activation. Stance-specific footwork in the cycle\'s target stance, paired gripping at 60–70% pressure, then competition-rhythm uchikomi on tokui-waza.',
        drills: [
          `Stance-specific footwork in ${cycle.stanceFocus ?? 'RR'} (3 min)`,
          'Paired gripping at 60–70% (2 × 90s rounds)',
          `Tokui uchikomi at competition rhythm (4 × 10 reps, ${cycle.stanceFocus ?? 'preferred'} stance)`,
        ],
        techniques: cycle.integratedTechniques,
        intensity: 3,
      }
    case 'peak':
      return {
        title: 'Warm-Up — Sharpening Activation',
        duration: 15,
        description: 'High-quality activation. Quick mobility, then immediate match-speed grip sharpening and tokui activation. No long base — get the system ready to fire.',
        drills: [
          'Targeted mobility (4 min): hip flexors, ankles, thoracic',
          'Grip sharpening at 90% intent (3 × 60s rounds)',
          'Tokui uchikomi at match speed (3 × 5 reps, full power)',
          'Reactive movement drill (partner mirror, 2 × 30s)',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 4,
      }
    case 'transition':
      return {
        title: 'Warm-Up — Free Movement',
        duration: 15,
        description: 'Self-directed movement. Light judo flow, exploring positions and grip exchanges without target pressure. Goal is reconnecting to the mat.',
        drills: [
          'Open mobility flow (5 min)',
          'Light partner gripping flow — no resistance (3 min)',
          'Self-directed uchikomi — any technique, slow tempo',
        ],
        techniques: [],
        intensity: 1,
      }
  }
}

function buildTechnical(
  phase: TechnicalPhase,
  cycle: TechnicalCycle,
  profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  const acq = cycle.acquisitionTargets
  const review = cycle.reviewTargets
  const integrated = cycle.integratedTechniques
  const stance = cycle.stanceFocus ?? 'RR'

  switch (phase) {
    case 'acquisition':
      return {
        title: 'Technical Section — Acquisition',
        duration: 25,
        description: `Uchikomi circuit on new acquisition targets (${joinLabels(acq, 2)}). 4 sets × 10 reps each side — bilateral work mandatory. Focus on step pattern, hip rotation timing, and partner positioning. Progressive sequence: stationary → moving partner → light resistance (30%).`,
        drills: [
          `Stationary uchikomi: ${joinLabels(acq, 2)} (4 × 10/side)`,
          `Moving uchikomi: same techniques (3 × 30s)`,
          `Nagekomi to crash pad: 3 × 5 reps each side (focus: clean finish)`,
          `Mirror footwork drill — left/right balance check (2 × 60s)`,
        ],
        techniques: acq,
        intensity: 2,
      }
    case 'consolidation':
      return {
        title: 'Technical Section — Combination Building',
        duration: 25,
        description: `Combination drills on integrated system: ${joinLabels(integrated, 2)}. Build setup-to-finish chains. ${cycle.stanceFocus ? `Cycle stance: ${stance}. ` : ''}Sets of 8 with partner reset between reps — each rep must complete the chain cleanly.`,
        drills: [
          `Setup-to-finish uchikomi: ${joinLabels(integrated, 2)} (4 × 8/side)`,
          `Reverse-engineering drill — finish technique, then explore what set it up`,
          `Nagekomi: 3 × 5 of best combination from week\'s theme`,
          `Review uchikomi: ${joinLabels(review, 2)} (2 × 10/side)`,
        ],
        techniques: [...integrated, ...review],
        intensity: 3,
      }
    case 'competition-integration':
      return {
        title: 'Technical Section — Stance-Specific Integration',
        duration: 20,
        description: `Stance-locked work in ${stance}. Drill the integrated system (${joinLabels(integrated, 2)}) against the specific opposing grip pattern that ${stance} produces. Partner gives realistic resistance (60–70%). Quality over volume.`,
        drills: [
          `${stance} stance uchikomi: integrated techniques (3 × 8/side, 70% resistance)`,
          `Grip-to-attack chain in ${stance}: 5 sec gripping → immediate attack`,
          `Nagekomi to crash pad with full grip resistance (3 × 4)`,
          `Counter-throw drill — partner attacks, athlete counters (2 × 60s)`,
        ],
        techniques: integrated,
        intensity: 4,
      }
    case 'peak':
      return {
        title: 'Technical Section — Sharpening',
        duration: 20,
        description: `Match-speed uchikomi and nagekomi on tokui-waza (${namedTokuiOrDefault(profile)}). Every rep at competition velocity. No volume work — only sharp, high-quality reps with full recovery between sets.`,
        drills: [
          `Match-speed uchikomi on tokui (3 × 5 reps, 90s rest between sets)`,
          `Crash-pad nagekomi at full power (3 × 3 reps)`,
          `Grip-and-attack within 3s drill (5 rounds, full intent)`,
        ],
        techniques: profile?.tokui ?? integrated,
        intensity: 5,
      }
    case 'transition':
      return {
        title: 'Technical Section — Creative Exploration',
        duration: 20,
        description: 'Open exploration — work weak-side techniques, try unfamiliar throws, play with grip configurations you wouldn\'t use in competition. No pressure on outcome. Goal is broadening the motor library.',
        drills: [
          'Weak-side uchikomi on tokui (3 × 8 reps, slow tempo)',
          'Unfamiliar technique exploration (athlete picks)',
          'Grip variation play — try non-default grips on familiar throws',
        ],
        techniques: [],
        intensity: 2,
      }
  }
}

function buildTactical(
  phase: TechnicalPhase,
  cycle: TechnicalCycle,
  _profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  const stance = cycle.stanceFocus ?? 'RR'

  switch (phase) {
    case 'acquisition':
      return {
        title: 'Tactical Drills — Distance & Rhythm',
        duration: 15,
        description: 'Footwork-led tactical drills. No real attacking yet — building the spatial awareness and rhythm that makes attacks possible. Partner provides target shapes but no resistance.',
        drills: [
          'Distance management drill — maintain attack range while partner moves (2 × 90s)',
          'Two-step setup drill — step + grip + step + attack (3 × 60s)',
          'Reaction drill — partner shows posture change, athlete steps to attack distance',
        ],
        techniques: cycle.acquisitionTargets,
        intensity: 2,
      }
    case 'consolidation':
      return {
        title: 'Tactical Drills — Combination Triggers',
        duration: 18,
        description: `Drilling the trigger that links setup to finish. ${cycle.theme.includes('Combination month') ? 'Combination month emphasis. ' : ''}Partner gives real reactions to first attack — athlete must read and select the correct follow-up.`,
        drills: [
          'Reaction-based combination drill: partner defends a way → athlete picks correct finish (3 × 90s)',
          'Failed-attack recovery drill: deliberately miss first attack, link immediately to second',
          'Grip-break → re-grip → attack sequence (3 × 60s)',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 3,
      }
    case 'competition-integration':
      return {
        title: 'Tactical Drills — Match Pressure',
        duration: 20,
        description: `${stance}-specific tactical scenarios. Drill the situations that produce shido pressure, edge situations, and golden-score positioning. Realistic intensity (70–80%).`,
        drills: [
          `${stance}-specific gripping war (3 × 60s rounds)`,
          'Shido-pressure drill: athlete must attack within 10s of grip contact',
          'Edge-pressure drill: closing 2m × 2m area, partner backs out, athlete must score in zone',
          'Score-then-defend: athlete scores waza-ari → 30s defense round',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 4,
      }
    case 'peak':
      return {
        title: 'Tactical Drills — Competition Simulation',
        duration: 18,
        description: 'Match-realistic tactical drills at competition intensity. Short, high-quality scenarios — golden score, score-and-defend, final 30 seconds. Full mental engagement.',
        drills: [
          'Golden-score simulation: 30s × 5 rounds, mandatory attack within 5s',
          'Final-30s drill: clock starts on losing position, athlete must score',
          `RR/RL specific scoring situations (3 × 90s)`,
          'Grip-and-attack within 5s rule challenge',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 5,
      }
    case 'transition':
      return {
        title: 'Tactical Drills — Free Play',
        duration: 12,
        description: 'No formal tactical objective. Free movement, free gripping, free exchange. Athlete experiments with positions they wouldn\'t risk in a real match.',
        drills: [
          'Open situational play — no rules, no resistance target',
          'Free gripping exchange — try novel configurations',
        ],
        techniques: [],
        intensity: 2,
      }
  }
}

function buildSituationalRandori(
  phase: TechnicalPhase,
  cycle: TechnicalCycle,
  _profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  const stance = cycle.stanceFocus ?? 'RR'

  switch (phase) {
    case 'acquisition':
      return {
        title: 'Situational Randori — Constrained',
        duration: 12,
        description: 'Constrained randori — only the week\'s acquisition techniques are scoring. Partner cannot block aggressively (50% defense). Goal is repetition under light pressure.',
        drills: [
          `Constrained randori — only ${joinLabels(cycle.acquisitionTargets, 2)} counts (3 × 3 min)`,
          'No-grip randori (2 × 90s) — work entries without dominant grip',
        ],
        techniques: cycle.acquisitionTargets,
        intensity: 3,
      }
    case 'consolidation':
      return {
        title: 'Situational Randori — Theme-Locked',
        duration: 15,
        description: `Randori constrained to the week\'s theme. Only ${joinLabels(cycle.integratedTechniques, 2)} count as scores. Partner defends at 70% — realistic pressure, but the menu is intentionally narrow to force depth.`,
        drills: [
          `Theme-locked randori (4 × 3 min) — only integrated techniques score`,
          'Combination-only round: a score requires two linked attacks',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 4,
      }
    case 'competition-integration':
      return {
        title: 'Situational Randori — Stance-Specific',
        duration: 15,
        description: `Randori locked to ${stance} stance. Both partners adopt the configuration. Realistic gripping fight, realistic defensive pressure. Goal is making the cycle\'s themes work under match conditions.`,
        drills: [
          `${stance} randori (4 × 3 min) — both partners locked to stance`,
          'First-attack rule: must commit within 10s of bow-in',
          'Edge randori: 3m × 3m area, stepping out = waza-ari for opponent',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 4,
      }
    case 'peak':
      return {
        title: 'Situational Randori — Match Scenarios',
        duration: 12,
        description: 'High-intensity, short situational rounds replicating match-end scenarios. Score-then-defend, golden score, fatigued-start. Each scenario is a complete tactical puzzle.',
        drills: [
          'Score-then-defend scenarios — 30s rounds (× 5)',
          'Golden-score 2 min simulations × 3',
          'Fatigued-start randori: 30 burpees → immediate 90s round',
        ],
        techniques: cycle.integratedTechniques,
        intensity: 5,
      }
    case 'transition':
      return {
        title: 'Situational Randori — Light Play',
        duration: 10,
        description: 'Optional light randori. Flow-style — exchange techniques, accept positions, no scoring pressure. Goal is mat time without stress.',
        drills: [
          'Flow randori (2 × 4 min, alternate attack and defense)',
        ],
        techniques: [],
        intensity: 2,
      }
  }
}

function buildMainRandori(
  phase: TechnicalPhase,
  _cycle: TechnicalCycle,
  _profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  switch (phase) {
    case 'acquisition':
      return {
        title: 'Main Randori — Volume',
        duration: 25,
        description: 'Volume-oriented randori. 5 × 4 min rounds, varied partners. Goal is mat time and exposure to many problems. Pace is moderate — every round at the same effort.',
        drills: [
          '5 × 4 min open randori, 60s rest between',
          'Rotate partners every round if possible',
        ],
        techniques: [],
        intensity: 3,
      }
    case 'consolidation':
      return {
        title: 'Main Randori — Quality Volume',
        duration: 25,
        description: 'Volume with intent. 5 × 4 min rounds. Athlete keeps a mental log of which combinations land and which fail. Coach can stop a round if quality drops significantly.',
        drills: [
          '5 × 4 min randori, 75s rest between',
          'Athlete reviews each round briefly (10s mental check)',
        ],
        techniques: [],
        intensity: 4,
      }
    case 'competition-integration':
      return {
        title: 'Main Randori — Match-Length',
        duration: 25,
        description: 'Match-length, match-intensity randori. 4 × 4 min rounds with full-rest intervals. Treat each round as a real match — bow in, fight, recover.',
        drills: [
          '4 × 4 min match-simulation rounds, 2 min rest',
          'Full bow-in and match protocol',
        ],
        techniques: [],
        intensity: 5,
      }
    case 'peak':
      return {
        title: 'Main Randori — Quality Sharpening',
        duration: 20,
        description: 'Reduced volume, maximum intensity. 4 × 3 min rounds at competition intensity. Long rest. Goal is sharpness, not fatigue accumulation. End the block early if quality drops.',
        drills: [
          '4 × 3 min competition-intensity rounds, 2 min rest',
          'Optional: 1 × 4 min "final" round at 100% intent',
        ],
        techniques: [],
        intensity: 5,
      }
    case 'transition':
      return {
        title: 'Main Randori — Optional Flow',
        duration: 15,
        description: 'Optional. 3 × 3 min flow rounds, exchange-based. No pressure on scoring. Athletes can sit out a round at any time.',
        drills: [
          '3 × 3 min flow randori, 90s rest',
        ],
        techniques: [],
        intensity: 2,
      }
  }
}

function buildNeWaza(
  phase: TechnicalPhase,
  cycle: TechnicalCycle,
  profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  const tachiToNe = cycle.integratedTechniques
    .flatMap(id => TECHNIQUE_MAP.get(id)?.transitionsTo ?? [])
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .slice(0, 3)
  const neStrength = profile?.neWazaStrength ?? 'moderate'

  switch (phase) {
    case 'acquisition':
      return {
        title: 'Ne-Waza — Foundation',
        duration: 12,
        description: 'Foundational ne-waza positions. Drill osaekomi escapes, basic submission entries (juji-gatame, kesa-gatame). Light situational rolling at the end.',
        drills: [
          'Pin escape drill: 3 × 90s under each of kesa, yoko-shiho, kami-shiho',
          'Juji-gatame entry from across-side (3 × 8 reps)',
          'Light situational rolling: 2 × 2 min, start from knees',
        ],
        techniques: ['kesa-gatame', 'yoko-shiho-gatame', 'juji-gatame'],
        intensity: 3,
      }
    case 'consolidation':
      return {
        title: 'Ne-Waza — Transition Density',
        duration: 12,
        description: `Linking tachi-waza to ne-waza. Drill the transition from the week\'s integrated throws into pins or submissions. Targets: ${tachiToNe.length ? joinLabels(tachiToNe) : 'juji-gatame, kesa-gatame'}.`,
        drills: [
          `Throw-to-pin transition drill (3 × 10 reps): integrated throw → immediate pin`,
          `Throw-to-juji-gatame drill (3 × 8 reps)`,
          `Turtle-attack drill: partner in turtle, 30s to score (3 rounds)`,
        ],
        techniques: tachiToNe.length ? tachiToNe : ['juji-gatame', 'kesa-gatame'],
        intensity: 4,
      }
    case 'competition-integration':
      return {
        title: 'Ne-Waza — Match-Realistic',
        duration: 12,
        description: 'Match-realistic ne-waza scenarios. Score-from-feet → continue on ground for 20 seconds. Includes the standing-to-ground transition rules.',
        drills: [
          'Standing-to-ground transition: throw → 20s to finish (5 rounds)',
          'Turtle defense → counter-attack drill (3 × 90s)',
          neStrength === 'strong'
            ? 'Athlete-on-attack situational ne-waza (4 × 2 min)'
            : 'Defensive ne-waza scenarios (4 × 2 min)',
        ],
        techniques: ['juji-gatame', 'kesa-gatame', 'sankaku-jime'],
        intensity: 4,
      }
    case 'peak':
      return {
        title: 'Ne-Waza — Sharp & Short',
        duration: 10,
        description: 'Short ne-waza block — high quality, no volume. Drill the athlete\'s preferred ground attack at match speed. Goal is sharpness, not fatigue.',
        drills: [
          'Tokui ne-waza attack at speed (3 × 5 reps)',
          'Quick-finish scenarios: 15s to finish from advantageous position (4 rounds)',
        ],
        techniques: profile?.technicalSystem?.neWazaChains.flatMap(c => c.submissions).slice(0, 3) ?? ['juji-gatame', 'sankaku-jime'],
        intensity: 4,
      }
    case 'transition':
      return {
        title: 'Ne-Waza — Open Flow',
        duration: 10,
        description: 'Free ne-waza flow. Exchange positions, accept submissions, explore unfamiliar attacks. No urgency.',
        drills: [
          'Flow ne-waza: 3 × 3 min, alternate attack/defense',
        ],
        techniques: [],
        intensity: 2,
      }
  }
}

function buildCooldown(
  phase: TechnicalPhase,
  _cycle: TechnicalCycle,
  _profile: AthleteTechnicalProfile | undefined,
): JudoSessionBlock {
  const isHighIntensity = phase === 'competition-integration' || phase === 'peak'
  return {
    title: 'Cool-Down & Reflection',
    duration: isHighIntensity ? 10 : 8,
    description: isHighIntensity
      ? 'Light movement to clear lactate, static stretching for hips and shoulders, breathing reset. Brief verbal reflection: what worked, what didn\'t, one cue for next session.'
      : 'Light flow walking + static stretch (hamstrings, hips, lats). Brief written or verbal note from the athlete on the session\'s technical theme.',
    drills: [
      'Light walking flow (3 min)',
      'Static stretch: hamstrings, hip flexors, lats, shoulders (4 min)',
      'Breathing reset: 4-7-8 pattern × 6',
      'Reflection note: one win, one cue',
    ],
    techniques: [],
    intensity: 1,
  }
}

// ---------------------------------------------------------------------------
// Session assembly
// ---------------------------------------------------------------------------

function buildSession(
  w: Week,
  cycle: TechnicalCycle,
  profile: AthleteTechnicalProfile | undefined,
  planId: string,
  sessionNumber: number,
): JudoSession {
  const phase = cycle.phase
  const warmup = buildWarmup(phase, cycle, profile)
  const technicalSection = buildTechnical(phase, cycle, profile)
  const tacticalDrills = buildTactical(phase, cycle, profile)
  const situationalRandori = buildSituationalRandori(phase, cycle, profile)
  const mainRandori = buildMainRandori(phase, cycle, profile)
  const neWaza = buildNeWaza(phase, cycle, profile)
  const cooldown = buildCooldown(phase, cycle, profile)

  const totalDuration =
    warmup.duration +
    technicalSection.duration +
    tacticalDrills.duration +
    situationalRandori.duration +
    mainRandori.duration +
    neWaza.duration +
    cooldown.duration

  const intensityLevel = clamp1to5(
    (warmup.intensity + technicalSection.intensity + tacticalDrills.intensity +
      situationalRandori.intensity + mainRandori.intensity + neWaza.intensity) / 6,
  )

  const technicalLoad = clamp1to5(
    (technicalSection.intensity + situationalRandori.intensity) / 2 +
      (phase === 'acquisition' || phase === 'consolidation' ? 1 : 0),
  )
  const tacticalLoad = clamp1to5(
    (tacticalDrills.intensity + situationalRandori.intensity + mainRandori.intensity) / 3,
  )

  const objective = `${cycle.theme} (${phase.replace(/-/g, ' ')}) — emphasis: ${cycle.sessionEmphasis}`

  return {
    id: crypto.randomUUID(),
    planId,
    weekNumber: w.weekNumber,
    sessionNumber,
    objective,
    technicalTheme: cycle.theme,
    tacticalTheme: cycle.tacticalTheme,
    stanceFocus: cycle.stanceFocus ?? 'RR',
    warmup,
    technicalSection,
    tacticalDrills,
    situationalRandori,
    mainRandori,
    neWaza,
    cooldown,
    totalDuration,
    intensityLevel,
    technicalLoad,
    tacticalLoad,
    generatedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateJudoSessions(
  weeks: Week[],
  cycles: TechnicalCycle[],
  profile: AthleteTechnicalProfile | undefined,
): JudoSession[] {
  const sessions: JudoSession[] = []
  const cycleByWeek = new Map<number, TechnicalCycle>()
  for (const c of cycles) cycleByWeek.set(c.weekNumber, c)

  for (const w of weeks) {
    // Skip travel weeks (athlete cannot train).
    if (isTravelOrCampWeek(w) && w.location === 'travel') continue
    // Skip competition weeks for now — those are handled separately by
    // the periodization plan; coaches don't need a generated training session
    // on the day of competition.
    if (isCompetitionWeek(w)) continue

    const cycle = cycleByWeek.get(w.weekNumber)
    if (!cycle) continue

    const count = sessionsPerWeek(w, cycle)
    for (let n = 1; n <= count; n++) {
      sessions.push(buildSession(w, cycle, profile, '', n))
    }
  }

  return sessions
}
