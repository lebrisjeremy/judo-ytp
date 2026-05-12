import { addDays, addWeeks, differenceInWeeks, format, parseISO, startOfWeek } from 'date-fns'
import type { Week, SeasonPhase, AthleteEvent } from '../types'

const POST_GOAL_BUFFER: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 }

export function computePlanLength(
  startDateStr: string,
  events: AthleteEvent[],
  mainGoalEventId?: string
): number {
  const comps = events.filter(e => e.type === 'competition')
  if (!comps.length) return 52
  const anchor =
    (mainGoalEventId ? comps.find(e => e.id === mainGoalEventId) : undefined) ??
    [...comps].sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())[0]
  const weeks = differenceInWeeks(parseISO(anchor.startDate), parseISO(startDateStr))
  return Math.max(12, weeks + (POST_GOAL_BUFFER[anchor.importance] ?? 2) + 1)
}

export function generateWeeks(startDateStr: string, count = 52): Week[] {
  const start = startOfWeek(parseISO(startDateStr), { weekStartsOn: 1 })
  return Array.from({ length: count }, (_, i) => {
    const monday = addWeeks(start, i)
    const sunday = addDays(monday, 6)
    return {
      weekNumber: i + 1,
      startDate: format(monday, 'yyyy-MM-dd'),
      endDate: format(sunday, 'yyyy-MM-dd'),
      seasonPhase: 'transition' as SeasonPhase,
      volume: 2 as const,
      intensity: 2 as const,
    }
  })
}

export function weekLabel(startDate: string): string {
  return format(parseISO(startDate), 'MMM d')
}

export function monthOf(startDate: string): string {
  return format(parseISO(startDate), 'MMMM yyyy')
}

export function shortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function weekRange(startDate: string, endDate: string): string {
  return `${format(parseISO(startDate), 'MMM d')} – ${format(parseISO(endDate), 'MMM d, yyyy')}`
}
