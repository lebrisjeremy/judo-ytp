import type { Week, SessionContent, ExerciseItem, CardioCycle, WeightCycle } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function vp<T>(vol: number, lo: T, mid: T, hi: T): T {
  if (vol <= 2) return lo
  if (vol >= 4) return hi
  return mid
}

function ip<T>(int: number, lo: T, mid: T, hi: T): T {
  if (int <= 2) return lo
  if (int >= 4) return hi
  return mid
}

function ex(name: string, sets: string, reps: string, rest: string, notes?: string): ExerciseItem {
  return { name, sets, reps, rest, notes }
}

function isTournamentWeek(week: Week): boolean {
  return !!(week.weekEvent || week.weekendEvent)
}

function isRestWeek(week: Week): boolean {
  return week.seasonPhase === 'transition' || week.travelNote === 'travel-after'
}

// ---------------------------------------------------------------------------
// Cardio session generators
// ---------------------------------------------------------------------------

type CardioGen = (vol: number, int: number, isTournament: boolean, n: 1 | 2) => SessionContent

const cardioGenerators: Record<CardioCycle, CardioGen> = {

  'aerobic-base': (vol, _int, _t, n) => {
    if (n === 1) {
      const mins = vp(vol, 20, 30, 40)
      return {
        title: 'Aerobic Base — Continuous Steady State',
        objective: 'Build aerobic foundation and fat oxidation capacity.',
        warmUp: '5–8 min easy jog or bike + dynamic leg swings, hip circles, ankle rotations.',
        mainSet: `${mins} min continuous run, bike, or row at 65–70% HR max. Pace must allow full sentences — purely conversational.`,
        restPeriods: 'No rest — continuous effort throughout.',
        coolDown: '5 min easy walk + static stretch (hamstrings, hip flexors, calves). 30s per position.',
        estimatedDuration: mins + 18,
        intensityTarget: 'HR 65–70% max. RPE 4–5/10.',
        coachingNotes: 'If athlete cannot hold a conversation, pace is too fast. Running, rowing, biking, or ski erg all acceptable — same effort target applies.',
      }
    } else {
      const rounds = vp(vol, 2, 3, 4)
      return {
        title: 'Aerobic Base — Cross-Training Circuit',
        objective: 'Sustained aerobic work across varied modalities.',
        warmUp: '5 min easy row + hip flexor and shoulder mobility (2 × 30s each).',
        mainSet: `${rounds} rounds × 10 min: [3 min row → 3 min bike → 4 min jog]. Minimal transitions. Substitute: 3 min jump rope + 3 min step-ups + 4 min shadow judo if no machines.`,
        restPeriods: '2 min between rounds.',
        coolDown: '5 min easy walk + breathing exercises.',
        estimatedDuration: rounds * 12 + 15,
        intensityTarget: 'HR 65–72% max across all modalities.',
        coachingNotes: 'Equipment substitution is always fine. Sustained aerobic effort at the right zone is the only goal.',
      }
    }
  },

  'aerobic-power': (vol, _int, _t, n) => {
    if (n === 1) {
      const reps = vp(vol, 3, 4, 6)
      const repMins = vp(vol, 5, 7, 8)
      return {
        title: 'Aerobic Power — Tempo Intervals',
        objective: 'Raise lactate threshold and develop aerobic power ceiling.',
        warmUp: '8–10 min progressive jog + 2 × 30s strides at tempo pace.',
        mainSet: `${reps} × ${repMins} min at 77–82% HR max. Pace is "comfortably hard" — controlled, not sprinting.`,
        restPeriods: '3 min active recovery (walk/light jog) between reps.',
        coolDown: '5 min easy jog + quad and calf stretch.',
        estimatedDuration: reps * (repMins + 3) + 18,
        intensityTarget: 'HR 77–82% max. RPE 6–7/10.',
        coachingNotes: 'HR should stabilize within first 2 min of each rep. If HR fails to recover below 75% during rest, reduce total reps. Pace is steady — not a build.',
      }
    } else {
      const reps = vp(vol, 3, 4, 5)
      return {
        title: 'Aerobic Power — Machine Threshold Repeats',
        objective: 'Sustained power output at aerobic ceiling — lactate threshold development.',
        warmUp: '8 min easy row + 2 min progressive build.',
        mainSet: `${reps} × 2000m row (or equivalent) at lactate threshold pace. Track 500m split — maintain ±3s across all reps.`,
        restPeriods: '3 min complete rest between reps.',
        coolDown: '5 min easy row + back and hip stretch.',
        estimatedDuration: reps * 11 + 16,
        intensityTarget: 'HR 75–82% max. Consistent split time is the target — not max effort.',
        coachingNotes: 'If split time degrades more than 5s from rep 1 to rep N, end the session. Consistency over pushing through fatigue.',
      }
    }
  },

  'lactic-capacity': (vol, int, _t, n) => {
    const reps = vp(vol, 4, 6, 8)
    const repMins = ip(int, 3, 4, 4)
    if (n === 1) {
      return {
        title: 'Lactic Capacity — Hard Extended Intervals',
        objective: 'Develop lactate tolerance and match-simulation endurance.',
        warmUp: '10 min progressive jog + 4 × 20s accelerations, 60s rest each.',
        mainSet: `${reps} × ${repMins} min at 85–90% HR max. This is high effort — significant lactate accumulation expected.`,
        restPeriods: `${repMins} min complete rest between reps. No active recovery — sit or stand still.`,
        coolDown: '8 min easy jog + controlled breathing recovery (in 4s, out 6s).',
        estimatedDuration: reps * (repMins * 2) + 22,
        intensityTarget: 'HR 85–90% max. RPE 8–9/10.',
        coachingNotes: 'Do not schedule this session within 10 days of a major competition. Strong breathing control under fatigue is a training goal in itself. Watch for form breakdown.',
      }
    } else {
      const sets = vp(vol, 3, 4, 5)
      return {
        title: 'Lactic Capacity — Judo-Specific Lactic Circuit',
        objective: 'Replicate match-specific metabolic demands in a judo context.',
        warmUp: '8 min light judo movement + osae-komi flow drills.',
        mainSet: `${sets} rounds: 10 × (20s nage-komi or uchi-komi at max intensity / 10s rest). Partner or crash pad. Technique must stay intact — stop if form collapses.`,
        restPeriods: '10s between reps within a round. 4 min complete rest between rounds.',
        coolDown: '5 min light movement + breath reset.',
        estimatedDuration: sets * 9 + 16,
        intensityTarget: 'Each 20s burst at 95%+ max effort. No coasting.',
        coachingNotes: 'Partner is preferred for nage-komi. Use uchi-komi on crash pad if solo. Technique failure under fatigue is the signal to stop — not discomfort.',
      }
    }
  },

  'lactic-power': (vol, _int, isTournament, n) => {
    const reps = isTournament ? vp(vol, 4, 5, 6) : vp(vol, 5, 7, 10)
    if (n === 1) {
      return {
        title: 'Lactic Power — Short Max Efforts',
        objective: 'Develop capacity to generate and repeat maximal short efforts (match-start power).',
        warmUp: '10 min progressive jog + 4 × 30s accelerations, 90s rest each.',
        mainSet: `${reps} × 90s all-out (sprint, hard row, or assault bike). Each rep is maximal — nothing held back.`,
        restPeriods: '3.5–4 min complete rest. HR must drop below 75% before next rep.',
        coolDown: '8 min easy movement + controlled breathing.',
        estimatedDuration: reps * 5.5 + 20,
        intensityTarget: 'RPE 9–10/10 each rep. HR should reach >90% by end of each rep.',
        coachingNotes: 'Do NOT reduce rest to fit more reps. Quality over quantity. If athlete cannot hit the same effort level on the next rep, end the session.',
      }
    } else {
      const matchReps = isTournament ? vp(vol, 5, 6, 8) : vp(vol, 6, 8, 12)
      return {
        title: 'Lactic Power — Match-Simulation Repeats',
        objective: 'Replicate competition intensity and short-duration maximal demand.',
        warmUp: '10 min light judo + progressive grip battles.',
        mainSet: `${matchReps} × 30s shiai-intensity effort (full grip battle or mock-match scenario with partner). Competition level every rep — no pacing.`,
        restPeriods: '2.5 min between reps. Reset mentally each time.',
        coolDown: '5 min light movement + full breath reset.',
        estimatedDuration: matchReps * 3 + 18,
        intensityTarget: 'Competition intensity (100%) for every rep.',
        coachingNotes: 'Partner must maintain real competition effort. Keep gripping and movement quality at competition standard under fatigue. Technique degrading is expected — complete breakdown is the stop signal.',
      }
    }
  },

  'alactic-power': (vol, _int, _t, n) => {
    const reps = vp(vol, 8, 10, 12)
    if (n === 1) {
      return {
        title: 'Alactic Power — Sprint Repeats',
        objective: 'Develop explosive speed and ATP-PC energy system (pure alactic power).',
        warmUp: '10 min progressive jog + dynamic warm-up + 4 easy strides, full recovery each.',
        mainSet: `${reps} × 8s maximum sprint (flat or slight uphill). 100% velocity from first step.`,
        restPeriods: '3 min complete rest — full recovery is essential. This is neural work, not cardio.',
        coolDown: '5 min easy walk/jog + hamstring and calf stretch.',
        estimatedDuration: reps * 3.2 + 18,
        intensityTarget: 'Maximum velocity every rep. HR target is irrelevant — neural output is the goal.',
        coachingNotes: 'Full recovery between reps is non-negotiable. If athlete cannot maintain sprint speed on next rep, the session ends. Maximum 12 reps regardless of volume setting.',
      }
    } else {
      const repsB = vp(vol, 10, 12, 15)
      return {
        title: 'Alactic Power — Reactive Acceleration',
        objective: 'First-step quickness and reactive start speed — critical for judo attack initiation.',
        warmUp: '10 min dynamic warm-up + 4 partner reaction drills (3 reps each).',
        mainSet: `${repsB} × 10m sprint from varied starting positions (standing, kneeling, seated, prone). Partner gives random visual or auditory start signal.`,
        restPeriods: '2–3 min full recovery between all reps.',
        coolDown: '5 min light movement + hip flexor stretch.',
        estimatedDuration: repsB * 2.8 + 18,
        intensityTarget: '100% acceleration on cue. First 3 steps are everything.',
        coachingNotes: 'Vary start position every rep. No anticipation allowed — wait for the signal. Focus is on the drive phase, not top-end speed.',
      }
    }
  },

  'speed-coordination': (vol, _int, _t, n) => {
    const circuits = vp(vol, 3, 4, 5)
    if (n === 1) {
      return {
        title: 'Speed & Coordination — Footwork Circuit',
        objective: 'Neuromuscular speed, footwork precision, and reactive movement.',
        warmUp: '5 min light jog + activation: skips, lateral bounds, quick feet.',
        mainSet: `${circuits} × 6 min circuit: [2 min agility ladder → 2 min cone directional change → 2 min partner mirror movement]. Full mental focus each circuit.`,
        restPeriods: '2 min between circuits. If quality drops, rest longer.',
        coolDown: '5 min light movement + ankle and hip mobility.',
        estimatedDuration: circuits * 8 + 14,
        intensityTarget: 'High neural quality, NOT cardiovascular fatigue. Every rep is fresh and maximal quality.',
        coachingNotes: 'This is neural work — do not grind through fatigue. Stop a circuit early if movement quality deteriorates. Less with quality beats more with slop.',
      }
    } else {
      const reps = vp(vol, 5, 6, 8)
      return {
        title: 'Speed & Coordination — Technical Speed (Uchi-komi Rushes)',
        objective: 'Maximum-speed technique — transfer speed quality into judo movement.',
        warmUp: '8 min light judo movement + standard uchi-komi progression (slow to fast).',
        mainSet: `${reps} × 30s max-speed uchi-komi (dominant throw) + ${reps} × 30s weak side. 2 min rest between all reps. Technique should be near-perfect at maximum velocity.`,
        restPeriods: '2 min between all reps — full recovery, never rushed.',
        coolDown: '5 min light movement + partner quality check on throw entry.',
        estimatedDuration: reps * 2 * 2.5 + 16,
        intensityTarget: 'Maximum velocity every rep. Zero fatigue accumulation — each rep is as fast as the first.',
        coachingNotes: 'This is NOT lactic work. If technique is deteriorating, rest longer. Athlete should surprise themselves with how fast they move when fully recovered.',
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Weight session generators
// ---------------------------------------------------------------------------

type WeightGen = (vol: number, int: number, isTournament: boolean, n: 1 | 2) => SessionContent

const weightGenerators: Record<WeightCycle, WeightGen> = {

  'reathletisation': (vol, _int, _t, n) => {
    const s = vp(vol, 2, 3, 3)
    if (n === 1) {
      return {
        title: 'Reathletisation — Movement Foundation',
        objective: 'Re-establish movement quality and prepare body for upcoming strength work.',
        warmUp: '5–8 min easy bike or jog + foam roll major muscle groups (quads, glutes, thoracic).',
        mainSet: `${s} sets per exercise. Focus is movement quality, not load. Light resistance (40–50% 1RM or bodyweight).`,
        restPeriods: '60s between sets. No rush.',
        coolDown: '5–8 min light walk + hip and shoulder mobility circuit.',
        estimatedDuration: s * 12 + 20,
        intensityTarget: 'Bodyweight to 50% 1RM. RPE 4–5/10.',
        coachingNotes: 'If athlete has been off training more than 2 weeks, use bodyweight only. No ego — this is GPP foundation work. Prioritize depth and control over any load.',
        exercises: [
          ex('Goblet squat', `${s}×`, '12–15', '60s', 'Full depth, upright torso'),
          ex('Romanian deadlift', `${s}×`, '12', '60s', 'Hinge at hip, neutral spine'),
          ex('Push-up (or incline)', `${s}×`, '10–12', '60s', 'Control the negative'),
          ex('TRX or band row', `${s}×`, '12', '60s', 'Scapula retraction focus'),
          ex('Pallof press', `${s}×`, '12/side', '45s', 'Anti-rotation, brace core'),
          ex('Hip flexor + thoracic rotation stretch', '2×', '30s each', '—'),
        ],
      }
    } else {
      return {
        title: 'Reathletisation — Stability & Injury Prevention',
        objective: 'Address muscle imbalances and build injury resilience.',
        warmUp: '5 min bike + banded clamshells (2 × 15) + band pull-aparts (2 × 20).',
        mainSet: `${s} sets per exercise. Minimal load. Movement control and single-limb stability are the goals.`,
        restPeriods: '45–60s between sets.',
        coolDown: '5 min hip mobility circuit (90/90, pigeon, hip flexor hold).',
        estimatedDuration: s * 10 + 20,
        intensityTarget: 'Bodyweight or minimal resistance. No loading until patterns are clean.',
        coachingNotes: 'Single-leg work will expose asymmetries — do not rush through them. These imbalances are where injuries happen. Take the time.',
        exercises: [
          ex('Single-leg Romanian DL', `${s}×`, '10/side', '60s', 'Light DB, balance and control'),
          ex('Copenhagen plank', `${s}×`, '20s/side', '45s', 'Hip adductor focus'),
          ex('Side plank with hip abduction', `${s}×`, '15/side', '45s'),
          ex('Face pull (cable or band)', `${s}×`, '15', '45s', 'External rotation, retract scapula'),
          ex('Dead bug', `${s}×`, '8/side', '45s', 'Slow and controlled, lower back flat'),
          ex('90/90 hip stretch', '2×', '30s/side', '—'),
        ],
      }
    }
  },

  'strength-endurance': (vol, _int, _t, n) => {
    const rounds = vp(vol, 3, 4, 5)
    if (n === 1) {
      return {
        title: 'Strength Endurance — Full Body Circuit',
        objective: 'Build muscular endurance and metabolic conditioning base.',
        warmUp: '5 min bike + compound movement prep sets (empty bar or bodyweight).',
        mainSet: `${rounds} rounds, minimal rest between exercises (30s). 60–70% 1RM throughout. Should finish each set with 2–3 reps in reserve.`,
        restPeriods: '30s between exercises within round. 2–3 min between rounds.',
        coolDown: '5 min light movement + lat and quad stretch.',
        estimatedDuration: rounds * 12 + 20,
        intensityTarget: '60–70% 1RM. RPE 6–7/10 per round, 8–9/10 by last round.',
        coachingNotes: 'Expect quality to decline by round 3-4 — that is normal. Complete technical breakdown is the stop signal. This is intentionally fatiguing.',
        exercises: [
          ex('Goblet squat', `${rounds}×`, '15–20', '30s rest, then next'),
          ex('DB push press', `${rounds}×`, '12–15', '30s rest, then next'),
          ex('KB Romanian DL', `${rounds}×`, '15', '30s rest, then next'),
          ex('Inverted or cable row', `${rounds}×`, '15', '30s rest, then next'),
          ex('Farmer carry', `${rounds}×`, '30m', '30s rest, then next'),
          ex('Plank', `${rounds}×`, '30–45s', '2–3 min, then next round'),
        ],
      }
    } else {
      const s = vp(vol, 3, 4, 4)
      return {
        title: 'Strength Endurance — Upper/Lower Alternating Pairs',
        objective: 'Strength endurance with structural balance (push/pull, upper/lower).',
        warmUp: '5 min row + upper and lower body activation.',
        mainSet: `${s} sets per pair. Superset format — minimal rest within a pair. 65–70% 1RM.`,
        restPeriods: '30s within pairs, 60s between pairs.',
        coolDown: '5 min stretch (chest, lats, hip flexors).',
        estimatedDuration: s * 14 + 20,
        intensityTarget: '65–70% 1RM. Constant movement between A1 and A2.',
        coachingNotes: 'Supersets demand good conditioning. If second exercise quality drops, add 60s rest within pairs until athlete adapts.',
        exercises: [
          ex('A1 — Bench press', `${s}×`, '12–15', '30s, then A2'),
          ex('A2 — Front squat or goblet squat', `${s}×`, '12', '60s, then A1'),
          ex('B1 — DB row', `${s}×`, '15/side', '30s, then B2'),
          ex('B2 — Romanian DL', `${s}×`, '12', '60s, then B1'),
          ex('C1 — DB shoulder press', `${s}×`, '12', '30s, then C2'),
          ex('C2 — Bulgarian split squat', `${s}×`, '10/side', '60s, then C1'),
        ],
      }
    }
  },

  'max-strength': (vol, int, isTournament, n) => {
    const effectiveInt = isTournament ? Math.min(int, 2) : int
    const loadPct = ip(effectiveInt, '70–75%', '80–87%', '87–92%')
    const s = vp(vol, 3, 4, 5)
    const r = ip(effectiveInt, '5–6', '4–5', '3–4')
    if (n === 1) {
      return {
        title: `Max Strength — Lower Body${isTournament ? ' (Reduced — Tournament Week)' : ''}`,
        objective: 'Maximize lower body force production (squat pattern and posterior chain).',
        warmUp: '8 min bike + barbell prep sets + thoracic and hip mobility.',
        mainSet: `${s} sets, ${r} reps. ${loadPct} 1RM. Record weights for progression tracking.`,
        restPeriods: '3–4 min between heavy sets. Full recovery — do not rush.',
        coolDown: '5 min easy movement + thoracic and hip flexor mobility.',
        estimatedDuration: s * 5 + 25,
        intensityTarget: `${loadPct} 1RM. Every rep technically clean — no rounding under load.`,
        coachingNotes: isTournament
          ? 'Tournament week — use reduced load. Maintain neural activation without accumulating fatigue.'
          : 'Spot heavy back squats. Technique first — if form breaks at this load, reduce weight. Volume is deliberately low for full recovery.',
        exercises: [
          ex('Back squat', `${s}×`, r, '3–4 min', loadPct + ' 1RM'),
          ex('Romanian DL', `${Math.max(s - 1, 2)}×`, '4–5', '3 min', '85% 1RM'),
          ex('Bulgarian split squat', '3×', '5/side', '2.5 min', 'Moderate — technique focus'),
          ex('Lat pulldown or pull-up', '3×', '5–6', '2 min', 'Weighted if possible'),
        ],
      }
    } else {
      return {
        title: `Max Strength — Upper Body${isTournament ? ' (Reduced — Tournament Week)' : ''}`,
        objective: 'Maximize upper body pull and push strength — gripping and throwing power.',
        warmUp: '8 min easy row + shoulder warm-up + prep sets.',
        mainSet: `${s} sets, ${r} reps. ${loadPct} 1RM. Pull-up is the most judo-specific exercise here.`,
        restPeriods: '3–4 min between heavy sets.',
        coolDown: 'Band shoulder care (2 × 15 external rotation) + forearm and grip stretch.',
        estimatedDuration: s * 5 + 25,
        intensityTarget: `${loadPct} 1RM.`,
        coachingNotes: isTournament
          ? 'Tournament week — reduce load. Keep neural activation without fatigue.'
          : 'Use lifting straps only if grip fails before target muscle. Grip strength transfers directly to competition.',
        exercises: [
          ex('Weighted pull-up (or lat pulldown)', `${s}×`, r, '3–4 min', loadPct + ' 1RM'),
          ex('Bench press or DB press', `${s}×`, r, '3–4 min', loadPct + ' 1RM'),
          ex('DB row (heavy)', '3×', '5–6/side', '2.5 min', 'Full range, control'),
          ex('Face pull (injury prevention)', '2×', '15', '45s', 'External rotation focus'),
        ],
      }
    }
  },

  'power': (vol, _int, isTournament, n) => {
    const s = vp(vol, 3, 4, 5)
    if (n === 1) {
      return {
        title: `Power — Olympic Lifting${isTournament ? ' (Light — Tournament Week)' : ''}`,
        objective: 'Convert max strength into explosive power — rapid force development.',
        warmUp: '10 min progressive warm-up + technique sets (empty bar cleans, 3 × 3).',
        mainSet: `${s} sets × 4 reps. ${isTournament ? '40–45%' : '50–60%'} 1RM. Bar speed is the goal — never sacrifice velocity for load.`,
        restPeriods: '2–3 min neural recovery between sets.',
        coolDown: '5 min mobility + hip flexor and ankle work.',
        estimatedDuration: s * 4 + 22,
        intensityTarget: `${isTournament ? '40–45%' : '50–60%'} 1RM. Maximal concentric intent every rep.`,
        coachingNotes: 'End the session if bar speed drops. Clean technique on hang power clean is non-negotiable. Load is always secondary to speed.',
        exercises: [
          ex('Hang power clean', `${s}×`, '4', '2–3 min', isTournament ? '40–45%' : '50–60%' + ' 1RM — explosive'),
          ex('Jump squat', `${s - 1}×`, '5', '2–3 min', '20–30% 1RM, maximal intent'),
          ex('Hip thrust', '3×', '6–8', '2 min', 'Moderate-heavy, full hip lock'),
          ex('Farmer carry', '3×', '30m', 'Full recovery', 'Heavy — grip and full-body tension'),
        ],
      }
    } else {
      return {
        title: `Power — Throws & Lower Body Power${isTournament ? ' (Light)' : ''}`,
        objective: 'Non-barbell explosive power — transfer directly to judo throwing mechanics.',
        warmUp: '10 min progressive warm-up + medicine ball prep (4 × 5 easy slams).',
        mainSet: `${s} sets. Maximal concentric intent on every rep. MB rotational throw replicates nage-waza torso mechanics.`,
        restPeriods: '2–2.5 min between sets (power, not metabolic — full recovery).',
        coolDown: '5 min light movement.',
        estimatedDuration: s * 4.5 + 20,
        intensityTarget: 'Maximum speed and intent. Load is 5–8 kg MB, bodyweight for jumps.',
        coachingNotes: 'MB rotational throw is the most judo-specific exercise. Replicate the torso rotation of your best throw. Full power every rep.',
        exercises: [
          ex('MB overhead slam', `${s}×`, '6–8', '2 min', '5–8 kg, max intent'),
          ex('Broad jump', `${s}×`, '5', '2.5 min', 'Stick landing, then explode'),
          ex('MB rotational throw (wall)', `${s}×`, '8/side', '2 min', 'Replicate nage-waza rotation'),
          ex('Trap bar jump or squat jump', `${s - 1}×`, '5', '2.5 min', '20–30% load'),
          ex('KB single-arm swing', '3×', '10/side', '1.5 min', 'Hip snap, not arms'),
        ],
      }
    }
  },

  'reactive': (vol, _int, _t, n) => {
    const s = vp(vol, 3, 4, 4)
    if (n === 1) {
      return {
        title: 'Reactive — Plyometric Power',
        objective: 'Develop reactive strength and stretch-shortening cycle efficiency.',
        warmUp: '10 min progressive jog + jump activation: 5 squat jumps + 5 broad jumps, full recovery.',
        mainSet: `${s} sets. Minimal ground contact time on depth jumps. Maximum height on all jumps. 100% effort every rep.`,
        restPeriods: '2–3 min full recovery — this is neural work.',
        coolDown: '5 min easy walk + calf and quad stretch.',
        estimatedDuration: s * 5 + 22,
        intensityTarget: 'Maximum reactive force. Bodyweight only. Box 40–60 cm.',
        coachingNotes: 'Do not perform this session under fatigue. If athlete cannot achieve good height on depth jumps by set 3, end the session. Ground contact must be as brief as possible.',
        exercises: [
          ex('Depth jump (step off box, immediate jump)', `${s}×`, '6–8', '2.5 min', 'Box 40–60 cm'),
          ex('Lateral bound (explosive, stick landing)', `${s}×`, '6/side', '2 min', 'Max horizontal distance'),
          ex('Sprint start', `${Math.min(s + 1, 6)}×`, '15m', 'Full recovery', 'Cue-based start'),
          ex('Clap push-up', `${s}×`, '5–6', '2 min', 'Max concentric velocity'),
        ],
      }
    } else {
      return {
        title: 'Reactive — Partner Reactive Drills',
        objective: 'Reactive force production in patterns directly mapped to judo combat.',
        warmUp: '5 min partner movement + 4 × partner chase drill (10m each).',
        mainSet: `${s} sets. Partner required. Mirror drill directly maps to kumikata and movement in randori. 100% reactive — no anticipation.`,
        restPeriods: 'Full recovery between power reps. Quality over density.',
        coolDown: '5 min light movement + hip and shoulder stretch.',
        estimatedDuration: s * 5.5 + 18,
        intensityTarget: 'Maximum reactive speed. Bodyweight and partner resistance.',
        coachingNotes: 'Partner quality matters. Work with an athlete of similar size. The mirror drill is the most judo-relevant drill in this session.',
        exercises: [
          ex('Partner mirror movement', `${s}×`, '30s', '2 min', 'Match partner lateral footwork exactly'),
          ex('Reactive sprint (visual/audio cue)', '6×', '10m', 'Full recovery', 'No anticipation'),
          ex('MB chest throw with partner', `${s}×`, '8', '2 min', 'Explosive push both directions'),
          ex('Band-resisted shuffle step', `${s}×`, '10m/direction', '90s'),
          ex('Resisted sprint (partner resistance)', '3×', '15m', 'Full recovery'),
        ],
      }
    }
  },

  'maintenance': (vol, _int, _t, n) => {
    const s = vp(vol, 2, 2, 3)
    if (n === 1) {
      return {
        title: 'Maintenance — Full Body Submaximal',
        objective: 'Maintain strength gains without accumulating fatigue before competition.',
        warmUp: '5 min bike + prep sets (very light, 40%).',
        mainSet: `${s} sets × 5 reps per exercise. 70–75% 1RM. End every set with 3+ reps in reserve — do not push to failure.`,
        restPeriods: '2 min between sets.',
        coolDown: '5 min light movement + full mobility.',
        estimatedDuration: s * 10 + 18,
        intensityTarget: '70–75% 1RM. Should feel easy. Athlete leaves the gym energized.',
        coachingNotes: 'This is neural activation — not a training stimulus. Keep it SHORT. If athlete feels tired leaving the gym, the session was too much.',
        exercises: [
          ex('Back squat or goblet squat', `${s}×`, '5', '2 min', '70–75% 1RM'),
          ex('Bench or push press', `${s}×`, '5', '2 min', '70–75% 1RM'),
          ex('Pull-up or cable row', `${s}×`, '5', '2 min', 'Moderate load'),
          ex('Romanian DL', `${s}×`, '5', '2 min', '70% 1RM'),
        ],
      }
    } else {
      return {
        title: 'Maintenance — Mobility & Accessory',
        objective: 'Support recovery, maintain movement quality, avoid detraining.',
        warmUp: '5 min light movement.',
        mainSet: 'Light accessory and mobility. 20–30 min total. Nothing hard.',
        restPeriods: '45–60s between exercises.',
        coolDown: '5–8 min full mobility flow.',
        estimatedDuration: 35,
        intensityTarget: 'Very light to bodyweight only. RPE 3–4/10.',
        coachingNotes: 'This session exists so the athlete feels good, not tired. Critical within 5 days of a major competition. Skip the ego.',
        exercises: [
          ex('Band pull-apart', '3×', '20', '45s'),
          ex('Face pull', '2×', '15', '45s'),
          ex('Single-leg RDL (light KB)', '2×', '10/side', '60s'),
          ex('Plank variations', '3×', '30s', '30s'),
          ex('Hip mobility circuit (90/90, pigeon, hip flexor)', '2×', '30s each position', '—'),
          ex('Dead hang or towel grip', '2×', '30s', '—', 'Grip strength maintenance'),
        ],
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateCardioSession(week: Week, n: 1 | 2): SessionContent {
  const cycle = week.cardioCycle ?? 'aerobic-base'
  const gen = cardioGenerators[cycle]
  return gen(week.volume, week.intensity, isTournamentWeek(week), n)
}

export function generateWeightSession(week: Week, n: 1 | 2): SessionContent {
  const cycle = week.weightCycle ?? 'reathletisation'
  // In transition weeks, always use maintenance
  const effectiveCycle = isRestWeek(week) ? 'maintenance' : cycle
  const gen = weightGenerators[effectiveCycle]
  return gen(week.volume, week.intensity, isTournamentWeek(week), n)
}

export function cardioSessionCount(week: Week): 0 | 1 | 2 {
  const n = week.sessions?.cardio ?? 0
  if (n <= 0) return 0
  if (n === 1) return 1
  return 2
}

export function weightSessionCount(week: Week): 0 | 1 | 2 {
  const n = week.sessions?.strengthCond ?? 0
  if (n <= 0) return 0
  if (n === 1) return 1
  return 2
}
