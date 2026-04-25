import { addDays, addWeeks, differenceInWeeks, format, isWithinInterval, parseISO, startOfWeek, subDays } from 'date-fns'
import type { AthleteEvent, Week, SeasonPhase, WeeklyTemplate, WeightCycle, CardioCycle, WeeklySchedule } from '../types'
import { DEFAULT_TEMPLATE } from '../types'

const TAPER_WEEKS: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 }
const RECOVERY_WEEKS: Record<number, number> = { 1: 0, 2: 1, 3: 1, 4: 2, 5: 2 }

// Physical testing every ~7 weeks, anchored to forge phases
const TESTING_INTERVAL = 7

interface PhaseAssignment {
  phase: SeasonPhase
  volume: 1 | 2 | 3 | 4 | 5
  intensity: 1 | 2 | 3 | 4 | 5
  isCamp: boolean
  weeksToNextComp: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function assignPhase(weekStart: Date, weekEnd: Date, events: AthleteEvent[]): PhaseAssignment {
  const upcoming = events
    .filter(e => e.type === 'competition' && parseISO(e.startDate) > weekEnd)
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
  const nextComp = upcoming[0]
  const weeksToNextComp = nextComp ? differenceInWeeks(parseISO(nextComp.startDate), weekStart) : 99

  const activeCamps = events.filter(e => {
    if (e.type !== 'camp') return false
    const s = parseISO(e.startDate)
    const end = e.endDate ? parseISO(e.endDate) : addDays(s, 6)
    return isWithinInterval(weekStart, { start: s, end }) || isWithinInterval(weekEnd, { start: s, end })
  })
  if (activeCamps.length > 0) {
    const camp = activeCamps[0]
    const vol = clamp(camp.importance + 2, 3, 5) as 1|2|3|4|5
    const int = clamp(camp.importance + 1, 3, 4) as 1|2|3|4|5
    return { phase: camp.importance >= 4 ? 'sculpt' : 'forge', volume: vol, intensity: int, isCamp: true, weeksToNextComp }
  }

  const thisWeekComps = events.filter(e => {
    if (e.type !== 'competition') return false
    const d = parseISO(e.startDate)
    return isWithinInterval(d, { start: weekStart, end: weekEnd })
  })
  if (thisWeekComps.length > 0) {
    const best = thisWeekComps.reduce((a, b) => a.importance >= b.importance ? a : b)
    const vol = clamp(3 - best.importance, 1, 2) as 1|2|3|4|5
    return { phase: 'battle', volume: vol, intensity: 3, isCamp: false, weeksToNextComp: 0 }
  }

  const past = events
    .filter(e => e.type === 'competition' && parseISO(e.startDate) < weekStart)
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())
  const lastComp = past[0]

  if (lastComp) {
    const weeksSince = differenceInWeeks(weekStart, parseISO(lastComp.startDate))
    if (weeksSince > 0 && weeksSince <= RECOVERY_WEEKS[lastComp.importance]) {
      return { phase: 'transition', volume: 1, intensity: 1, isCamp: false, weeksToNextComp }
    }
  }

  if (!nextComp) return { phase: 'forge', volume: 4, intensity: 3, isCamp: false, weeksToNextComp: 99 }

  const weeksOut = differenceInWeeks(parseISO(nextComp.startDate), weekStart)
  const taper = TAPER_WEEKS[nextComp.importance]

  if (weeksOut <= taper) {
    const sharpenVol = clamp(weeksOut + (5 - nextComp.importance), 1, 3) as 1|2|3|4|5
    const sharpenInt = clamp(6 - weeksOut, 3, 5) as 1|2|3|4|5
    return { phase: 'sharpening', volume: sharpenVol, intensity: sharpenInt, isCamp: false, weeksToNextComp: weeksOut }
  }
  if (weeksOut === taper + 1) return { phase: 'conversion', volume: 3, intensity: 4, isCamp: false, weeksToNextComp: weeksOut }
  if (weeksOut <= taper + 4) {
    const vol = clamp(5 - Math.max(0, taper + 4 - weeksOut), 3, 5) as 1|2|3|4|5
    return { phase: 'sculpt', volume: vol, intensity: 4, isCamp: false, weeksToNextComp: weeksOut }
  }
  const forgeVol = clamp(3 + Math.min(2, Math.floor((weeksOut - taper - 4) / 3)), 3, 5) as 1|2|3|4|5
  return { phase: 'forge', volume: forgeVol, intensity: 3, isCamp: false, weeksToNextComp: weeksOut }
}

// Weight cycle: phase-driven with weeksToNextComp for intra-phase progression
// Rules: never max-strength in battle; reathletisation in early forge/transition
function assignWeightCycle(
  phase: SeasonPhase,
  weeksToNextComp: number,
  _trainingAge: number,
): WeightCycle {
  if (phase === 'battle')     return 'maintenance'
  if (phase === 'sharpening') return 'reactive'
  if (phase === 'transition') return 'reathletisation'
  if (phase === 'conversion') return 'power'
  if (phase === 'sculpt')     return weeksToNextComp > 6 ? 'max-strength' : 'power'
  // forge (Dev 1): progress Reathletisation → Strength Endurance → Max Strength
  if (weeksToNextComp > 20) return 'reathletisation'
  if (weeksToNextComp > 12) return 'strength-endurance'
  return 'max-strength'
}

// Cardio cycle: energy-system progression from aerobic base to anaerobic/speed
// Rules: never lactic-power/alactic in early forge; speed-coordination only in sharpening
function assignCardioCycle(
  phase: SeasonPhase,
  weeksToNextComp: number,
  _athleteLevel: string,
): CardioCycle {
  if (phase === 'battle')     return 'lactic-power'
  if (phase === 'sharpening') return 'speed-coordination'
  if (phase === 'transition') return 'aerobic-base'
  if (phase === 'conversion') return 'alactic-power'
  if (phase === 'sculpt')     return weeksToNextComp > 6 ? 'lactic-capacity' : 'lactic-power'
  // forge (Dev 1): Aerobic Base → Aerobic Power → Lactic Capacity
  if (weeksToNextComp > 20) return 'aerobic-base'
  if (weeksToNextComp > 12) return 'aerobic-power'
  return 'lactic-capacity'
}

function countFromSchedule(schedule: WeeklySchedule) {
  let randori = 0, technical = 0, strengthCond = 0, cardio = 0
  for (const day of schedule.days) {
    for (const s of day.sessions) {
      if (s.type === 'randori') randori++
      else if (s.type === 'technical') technical++
      else if (s.type === 'strength-cond') strengthCond++
      else if (s.type === 'cardio') cardio++
    }
  }
  return { randori, technical, strengthCond, cardio }
}

function buildSessions(
  phase: SeasonPhase,
  isCamp: boolean,
  tmpl: WeeklyTemplate,
  hasComp: boolean,
  schedule?: WeeklySchedule,
) {
  if (phase === 'transition') {
    return { randori: 0, technical: 1, strengthCond: 0, cardio: 0, physicalTesting: false, tournament: false }
  }
  if (isCamp) {
    return { randori: 5, technical: 2, strengthCond: 1, cardio: 1, physicalTesting: false, tournament: false }
  }
  const base = schedule
    ? countFromSchedule(schedule)
    : { randori: tmpl.randoriPerWeek, technical: tmpl.technicalPerWeek, strengthCond: tmpl.strengthCondPerWeek, cardio: 0 }
  const taper = phase === 'sharpening' || phase === 'battle'
  return {
    randori: taper ? Math.max(1, base.randori - 1) : base.randori,
    technical: base.technical,
    strengthCond: taper ? Math.max(0, base.strengthCond - 1) : base.strengthCond,
    cardio: taper ? Math.max(0, base.cardio - 1) : base.cardio,
    physicalTesting: false,
    tournament: hasComp,
  }
}

function isNearMajorComp(weekStart: Date, events: AthleteEvent[], withinWeeks = 2): boolean {
  return events.some(e => {
    if (e.type !== 'competition' || e.importance < 3) return false
    const d = parseISO(e.startDate)
    const diff = Math.abs(differenceInWeeks(d, weekStart))
    return diff <= withinWeeks
  })
}

function getTravelNote(
  weekStart: Date,
  weekEnd: Date,
  events: AthleteEvent[]
): 'travel-before' | 'travel-after' | null {
  for (const e of events) {
    const eDate = parseISO(e.startDate)
    const eEnd = e.type === 'camp' && e.endDate ? parseISO(e.endDate) : eDate

    if ((e.travelBefore ?? 0) > 0) {
      const travelStart = subDays(eDate, e.travelBefore!)
      // Travel period starts in/before this week AND event is in a later week
      if (travelStart <= weekEnd && eDate > weekEnd) return 'travel-before'
    }

    if ((e.travelAfter ?? 0) > 0) {
      const travelEnd = addDays(eEnd, e.travelAfter!)
      // Travel period ends in/after this week AND event ended in an earlier week
      if (travelEnd >= weekStart && eEnd < weekStart) return 'travel-after'
    }
  }
  return null
}

function eventToCompetition(e: AthleteEvent) {
  const type = e.importance >= 4 ? 'target' : e.importance === 3 ? 'medium' : 'development'
  return { name: e.name, importance: e.importance as 1|2|3|4|5, type: type as 'development'|'medium'|'target'|'camp', location: e.location }
}

export function autoGenerateWeeks(
  startDateStr: string,
  events: AthleteEvent[],
  count: number,
  template?: WeeklyTemplate,
  trainingAge = 2,
  athleteLevel = 'junior',
  schedule?: WeeklySchedule,
): Week[] {
  const tmpl = template ?? DEFAULT_TEMPLATE
  const planStart = startOfWeek(parseISO(startDateStr), { weekStartsOn: 1 })
  let lastTestingWeek = -TESTING_INTERVAL // so first test can fire early

  return Array.from({ length: count }, (_, i) => {
    const monday = addWeeks(planStart, i)
    const sunday = addDays(monday, 6)

    let { phase, volume, intensity, isCamp, weeksToNextComp } = assignPhase(monday, sunday, events)

    const thisWeekComps = events.filter(e => {
      if (e.type !== 'competition') return false
      return isWithinInterval(parseISO(e.startDate), { start: monday, end: sunday })
    })
    const thisWeekCamps = events.filter(e => {
      if (e.type !== 'camp') return false
      const s = parseISO(e.startDate)
      const end = e.endDate ? parseISO(e.endDate) : addDays(s, 6)
      return isWithinInterval(monday, { start: s, end }) || isWithinInterval(sunday, { start: s, end })
    })

    // Travel: apply volume/phase adjustments only when no event is active this week
    const travelNote = getTravelNote(monday, sunday, events)
    const thisWeekHasEvent = thisWeekComps.length > 0 || thisWeekCamps.length > 0
    if (!thisWeekHasEvent) {
      if (travelNote === 'travel-after') {
        phase = 'transition'; volume = 1 as 1|2|3|4|5; intensity = 1 as 1|2|3|4|5
      } else if (travelNote === 'travel-before') {
        volume = clamp(volume - 1, 1, 5) as 1|2|3|4|5
      }
    }

    // Physical testing: every TESTING_INTERVAL weeks, only in forge phase, not near major comp
    let physicalTestingProposed = false
    if (
      phase === 'forge' &&
      i - lastTestingWeek >= TESTING_INTERVAL &&
      !isNearMajorComp(monday, events, 2)
    ) {
      physicalTestingProposed = true
      lastTestingWeek = i
    }

    const weekEvent = thisWeekComps[0] ? eventToCompetition(thisWeekComps[0]) : undefined
    const weekendEvent = thisWeekComps[1] ? eventToCompetition(thisWeekComps[1]) : undefined
    const location: Week['location'] = isCamp || thisWeekCamps.length > 0 ? 'camp'
      : thisWeekComps.some(e => e.location) ? 'travel' : 'home'

    return {
      weekNumber: i + 1,
      startDate: format(monday, 'yyyy-MM-dd'),
      endDate: format(sunday, 'yyyy-MM-dd'),
      seasonPhase: phase,
      volume,
      intensity,
      physicalTestingProposed,
      weekEvent,
      weekendEvent,
      location,
      travelNote: travelNote ?? undefined,
      sessions: buildSessions(phase, isCamp, tmpl, thisWeekComps.length > 0, schedule),
      weightCycle: assignWeightCycle(phase, weeksToNextComp, trainingAge),
      cardioCycle: assignCardioCycle(phase, weeksToNextComp, athleteLevel),
    } satisfies Week
  })
}
