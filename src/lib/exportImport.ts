import type { Athlete, YearlyPlan, GlobalEvent } from '../types'
import { format } from 'date-fns'

export const EXPORT_VERSION = 1

export interface AthleteExport {
  exportVersion: 1
  exportDate: string
  athlete: Athlete
  plans: YearlyPlan[]
  globalEvents: GlobalEvent[]
}

export type ValidationResult =
  | { ok: true; data: AthleteExport }
  | { ok: false; error: string }

export function exportAthlete(
  athlete: Athlete,
  allPlans: YearlyPlan[],
  allGlobalEvents: GlobalEvent[],
): void {
  const plans = allPlans.filter(p => p.athleteId === athlete.id)
  const refIds = new Set((athlete.eventRefs ?? []).map(r => r.eventId))
  const globalEvents = allGlobalEvents.filter(e => refIds.has(e.id))

  const data: AthleteExport = {
    exportVersion: EXPORT_VERSION,
    exportDate: format(new Date(), 'yyyy-MM-dd'),
    athlete,
    plans,
    globalEvents,
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
}

export function resolveImport(
  data: AthleteExport,
  existingGlobalEvents: GlobalEvent[],
  mode: 'replace' | 'copy',
): ResolvedImport {
  let athlete = { ...data.athlete }

  if (mode === 'copy') {
    athlete = { ...athlete, id: crypto.randomUUID(), name: athlete.name + ' (Copy)' }
  }

  // Deduplicate events: match by id, then by name+startDate
  const eventIdMap = new Map<string, string>()
  const newGlobalEvents: GlobalEvent[] = []

  for (const ge of data.globalEvents) {
    if (existingGlobalEvents.find(e => e.id === ge.id)) {
      eventIdMap.set(ge.id, ge.id)
    } else {
      const match = existingGlobalEvents.find(
        e => e.name === ge.name && e.startDate === ge.startDate
      )
      if (match) {
        eventIdMap.set(ge.id, match.id)
      } else {
        eventIdMap.set(ge.id, ge.id)
        newGlobalEvents.push(ge)
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
    id: mode === 'copy' ? crypto.randomUUID() : p.id,
  }))

  return { athlete, plans, newGlobalEvents }
}
