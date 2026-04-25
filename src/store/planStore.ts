import { create } from 'zustand'
import type { Athlete, YearlyPlan, Week, GlobalEvent } from '../types'
import { resolveAthleteEvents } from '../types'
import { storage } from '../storage'
import { generateWeeks, computePlanLength } from '../lib/dates'
import { autoGenerateWeeks } from '../lib/autoplan'
import { format } from 'date-fns'

interface PlanStore {
  athletes: Athlete[]
  plans: YearlyPlan[]
  globalEvents: GlobalEvent[]
  activePlanId: string | null

  loadAll: () => void
  saveAthlete: (a: Athlete) => void
  deleteAthlete: (id: string) => void
  saveGlobalEvent: (event: GlobalEvent) => void
  deleteGlobalEvent: (id: string) => void

  createPlan: (athleteId: string, title: string, startDate: string, autoGenerate?: boolean) => string
  regeneratePlan: (planId: string) => void
  deletePlan: (id: string) => void
  setActivePlan: (id: string | null) => void
  updateWeek: (planId: string, weekNumber: number, patch: Partial<Week>) => void
  updatePlanMode: (planId: string, mode: 'simple' | 'detailed') => void
  updatePlanMeta: (planId: string, patch: Partial<Pick<YearlyPlan, 'title' | 'notes'>>) => void
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  athletes: [],
  plans: [],
  globalEvents: [],
  activePlanId: null,

  loadAll() {
    let athletes = storage.getAthletes()
    let globalEvents = storage.getGlobalEvents()

    // One-time migration: move legacy athlete.events → GlobalEvent + AthleteEventRef
    athletes = athletes.map(athlete => {
      if (athlete.eventRefs !== undefined || !athlete.events?.length) return athlete
      const newRefs = athlete.events.map(ev => {
        // Add to global if not already there
        if (!globalEvents.find(g => g.id === ev.id)) {
          const ge: GlobalEvent = {
            id: ev.id, name: ev.name, type: ev.type,
            startDate: ev.startDate, endDate: ev.endDate,
            location: ev.location, travelBefore: ev.travelBefore,
            travelAfter: ev.travelAfter, notes: ev.notes,
          }
          globalEvents.push(ge)
          storage.saveGlobalEvent(ge)
        }
        return { eventId: ev.id, importance: ev.importance }
      })
      const migrated = { ...athlete, eventRefs: newRefs, events: undefined }
      storage.saveAthlete(migrated)
      return migrated
    })

    set({ athletes, plans: storage.getPlans(), globalEvents })
  },

  saveAthlete(athlete) {
    storage.saveAthlete(athlete)
    set({ athletes: storage.getAthletes() })
  },

  deleteAthlete(id) {
    storage.deleteAthlete(id)
    set({ athletes: storage.getAthletes(), plans: storage.getPlans() })
  },

  saveGlobalEvent(event) {
    storage.saveGlobalEvent(event)
    set({ globalEvents: storage.getGlobalEvents() })
  },

  deleteGlobalEvent(id) {
    storage.deleteGlobalEvent(id)
    set({ globalEvents: storage.getGlobalEvents() })
  },

  createPlan(athleteId, title, startDate, autoGenerate = false) {
    const id = crypto.randomUUID()
    const athlete = get().athletes.find(a => a.id === athleteId)
    const events = resolveAthleteEvents(athlete?.eventRefs ?? [], get().globalEvents)
    const count = computePlanLength(startDate, events)
    const weeks = autoGenerate && events.length > 0
      ? autoGenerateWeeks(startDate, events, count, undefined, athlete?.trainingAge ?? 2, athlete?.level ?? 'junior')
      : generateWeeks(startDate, count)
    const plan: YearlyPlan = {
      id,
      athleteId,
      title,
      startDate,
      weeks,
      planMode: 'simple',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }
    storage.savePlan(plan)
    set({ plans: storage.getPlans() })
    return id
  },

  regeneratePlan(planId) {
    const plans = get().plans.map(p => {
      if (p.id !== planId) return p
      const athlete = get().athletes.find(a => a.id === p.athleteId)
      const events = resolveAthleteEvents(athlete?.eventRefs ?? [], get().globalEvents)
      const count = computePlanLength(p.startDate, events, p.mainGoalEventId)
      const weeks = events.length > 0
        ? autoGenerateWeeks(p.startDate, events, count, p.weeklyTemplate, athlete?.trainingAge ?? 2, athlete?.level ?? 'junior')
        : generateWeeks(p.startDate, count)
      const updated: YearlyPlan = {
        ...p,
        weeks,
        updatedAt: format(new Date(), 'yyyy-MM-dd'),
      }
      storage.savePlan(updated)
      return updated
    })
    set({ plans })
  },

  deletePlan(id) {
    storage.deletePlan(id)
    set({ plans: storage.getPlans(), activePlanId: get().activePlanId === id ? null : get().activePlanId })
  },

  setActivePlan(id) {
    set({ activePlanId: id })
  },

  updateWeek(planId, weekNumber, patch) {
    const plans = get().plans.map(p => {
      if (p.id !== planId) return p
      const updated: YearlyPlan = {
        ...p,
        updatedAt: format(new Date(), 'yyyy-MM-dd'),
        weeks: p.weeks.map(w => w.weekNumber === weekNumber ? { ...w, ...patch } : w),
      }
      storage.savePlan(updated)
      return updated
    })
    set({ plans })
  },

  updatePlanMode(planId, mode) {
    const plans = get().plans.map(p => {
      if (p.id !== planId) return p
      const updated = { ...p, planMode: mode, updatedAt: format(new Date(), 'yyyy-MM-dd') }
      storage.savePlan(updated)
      return updated
    })
    set({ plans })
  },

  updatePlanMeta(planId, patch) {
    const plans = get().plans.map(p => {
      if (p.id !== planId) return p
      const updated = { ...p, ...patch, updatedAt: format(new Date(), 'yyyy-MM-dd') }
      storage.savePlan(updated)
      return updated
    })
    set({ plans })
  },
}))
