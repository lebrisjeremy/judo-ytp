import type { Athlete, YearlyPlan, GlobalEvent, WeeklySchedule } from '../types'
import { format } from 'date-fns'

export const EXPORT_VERSION = 1

export interface AthleteExport {
  exportVersion: 1
  exportDate: string
  athlete: Athlete
  plans: YearlyPlan[]
  globalEvents: GlobalEvent[]
  weeklySchedule?: WeeklySchedule
}

export type ValidationResult =
  | { ok: true; data: AthleteExport }
  | { ok: false; error: string }

export function exportAthlete(
  athlete: Athlete,
  allPlans: YearlyPlan[],
  allGlobalEvents: GlobalEvent[],
  allSchedules: WeeklySchedule[],
): void {
  const plans = allPlans.filter(p => p.athleteId === athlete.id)
  const refIds = new Set((athlete.eventRefs ?? []).map(r => r.eventId))
  const globalEvents = allGlobalEvents.filter(e => refIds.has(e.id))
  const weeklySchedule = athlete.scheduleId
    ? allSchedules.find(s => s.id === athlete.scheduleId)
    : undefined

  const data: AthleteExport = {
    exportVersion: EXPORT_VERSION,
    exportDate: format(new Date(), 'yyyy-MM-dd'),
    athlete,
    plans,
    globalEvents,
    weeklySchedule,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `YTP_${athlete.name.replace(/\s+/g, '_')}_export.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function validateImport(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null)
    return { ok: false, error: 'Invalid file — expected a JSON object.' }
  const d = raw as Record<string, unknown>
  if (d.exportVersion !== EXPORT_VERSION)
    return { ok: false, error: `Unsupported export version (got ${d.exportVersion}, expected ${EXPORT_VERSION}).` }
  const a = d.athlete as Record<string, unknown> | undefined
  if (!a || typeof a.id !== 'string' || typeof a.name !== 'string' || typeof a.weightClass !== 'string')
    return { ok: false, error: 'Invalid or missing athlete data.' }
  if (!Array.isArray(d.plans))
    return { ok: false, error: 'Invalid plans data.' }
  if (!Array.isArray(d.globalEvents))
    return { ok: false, error: 'Invalid events data.' }
  return { ok: true, data: raw as AthleteExport }
}

export interface ResolvedImport {
  athlete: Athlete
  plans: YearlyPlan[]
  newGlobalEvents: GlobalEvent[]
  newSchedule?: WeeklySchedule
}

export function resolveImport(
  data: AthleteExport,
  existingGlobalEvents: GlobalEvent[],
  existingSchedules: WeeklySchedule[],
  mode: 'replace' | 'copy' | 'new',
): ResolvedImport {
  let athlete = { ...data.athlete }

  // For 'new' and 'copy' modes: fresh athlete UUID. 'new' = cross-user (no rename).
  if (mode === 'copy') {
    athlete = { ...athlete, id: crypto.randomUUID(), name: athlete.name + ' (Copy)' }
  } else if (mode === 'new') {
    athlete = { ...athlete, id: crypto.randomUUID() }
  }

  // --- Weekly Schedule ---
  // In 'replace' mode: keep existing scheduleId as-is (same user, schedule already exists).
  // In 'new'/'copy' mode: bring the schedule along if it was exported.
  let newSchedule: WeeklySchedule | undefined
  if (mode !== 'replace' && data.weeklySchedule) {
    const exportedSchedule = data.weeklySchedule
    const existingMatch = existingSchedules.find(
      s => s.id === exportedSchedule.id ||
        (s.name === exportedSchedule.name)
    )
    if (existingMatch) {
      // Importing user already has this schedule — point athlete to it
      athlete = { ...athlete, scheduleId: existingMatch.id }
    } else {
      // Brand-new schedule for this user — assign fresh UUID
      const freshScheduleId = crypto.randomUUID()
      newSchedule = { ...exportedSchedule, id: freshScheduleId }
      athlete = { ...athlete, scheduleId: freshScheduleId }
    }
  } else if (mode !== 'replace') {
    // No schedule in export — clear any dangling scheduleId
    athlete = { ...athlete, scheduleId: undefined }
  }

  // --- Global Events ---
  const eventIdMap = new Map<string, string>()
  const newGlobalEvents: GlobalEvent[] = []

  for (const ge of data.globalEvents) {
    const byId = existingGlobalEvents.find(e => e.id === ge.id)
    if (byId) {
      eventIdMap.set(ge.id, ge.id)
    } else {
      const byNameDate = existingGlobalEvents.find(
        e => e.name === ge.name && e.startDate === ge.startDate
      )
      if (byNameDate) {
        eventIdMap.set(ge.id, byNameDate.id)
      } else {
        // In 'new'/'copy' modes, generate a fresh UUID so it doesn't collide with
        // an event owned by another user in Supabase (RLS would block the upsert).
        const freshId = mode !== 'replace' ? crypto.randomUUID() : ge.id
        eventIdMap.set(ge.id, freshId)
        newGlobalEvents.push({ ...ge, id: freshId })
      }
    }
  }

  // Remap athlete eventRefs to resolved event ids
  athlete.eventRefs = (athlete.eventRefs ?? []).map(ref => ({
    ...ref,
    eventId: eventIdMap.get(ref.eventId) ?? ref.eventId,
  }))

  const plans: YearlyPlan[] = data.plans.map(p => ({
    ...p,
    athleteId: athlete.id,
    id: mode !== 'replace' ? crypto.randomUUID() : p.id,
  }))

  return { athlete, plans, newGlobalEvents, newSchedule }
}
