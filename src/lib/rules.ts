import { differenceInWeeks, parseISO } from 'date-fns'
import type { Week, AthleteEvent } from '../types'

export interface RuleResult {
  id: string
  level: 'warning' | 'info'
  message: string
}

export function checkNoGoalSet(events: AthleteEvent[]): RuleResult | null {
  const hasTarget = events.some(e => e.type === 'competition' && e.importance >= 4)
  if (!hasTarget) {
    return {
      id: 'no-goal',
      level: 'info',
      message: 'No target competition (★★★★+) found. Add a main goal event for a more precise periodization.',
    }
  }
  return null
}

export function checkEventDensity(events: AthleteEvent[]): RuleResult | null {
  const comps = events
    .filter(e => e.type === 'competition')
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())

  for (let i = 0; i < comps.length - 2; i++) {
    const span = differenceInWeeks(parseISO(comps[i + 2].startDate), parseISO(comps[i].startDate))
    if (span <= 3) {
      return {
        id: 'event-density',
        level: 'warning',
        message: `3 competitions within ${span} weeks detected. Consider spacing events to allow proper recovery and peaking.`,
      }
    }
  }
  return null
}

export function checkMainGoalPrep(weeks: Week[], events: AthleteEvent[]): RuleResult | null {
  const mainGoal = events
    .filter(e => e.type === 'competition' && e.importance >= 4)
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())[0]

  if (!mainGoal) return null

  const goalDate = parseISO(mainGoal.startDate)
  const sharpeningBeforeGoal = weeks.filter(w => {
    const wStart = parseISO(w.startDate)
    const weeksOut = differenceInWeeks(goalDate, wStart)
    return weeksOut >= 1 && weeksOut <= 4 && w.seasonPhase === 'sharpening'
  })

  if (sharpeningBeforeGoal.length === 0) {
    return {
      id: 'no-sharpening',
      level: 'warning',
      message: `No sharpening weeks in the 4 weeks before "${mainGoal.name}". Check your event dates and regenerate.`,
    }
  }
  return null
}

export function runAllRules(weeks: Week[], events: AthleteEvent[]): RuleResult[] {
  return [
    checkNoGoalSet(events),
    checkEventDensity(events),
    checkMainGoalPrep(weeks, events),
  ].filter((r): r is RuleResult => r !== null)
}
