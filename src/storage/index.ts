import type { Athlete, YearlyPlan, GlobalEvent } from '../types'

const ATHLETES_KEY = 'judo_ytp_athletes'
const PLANS_KEY = 'judo_ytp_plans'
const GLOBAL_EVENTS_KEY = 'judo_ytp_global_events'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getAthletes(): Athlete[] {
    return load<Athlete[]>(ATHLETES_KEY, [])
  },
  saveAthlete(athlete: Athlete): void {
    const all = storage.getAthletes()
    const idx = all.findIndex(a => a.id === athlete.id)
    if (idx >= 0) all[idx] = athlete
    else all.push(athlete)
    save(ATHLETES_KEY, all)
  },
  deleteAthlete(id: string): void {
    save(ATHLETES_KEY, storage.getAthletes().filter(a => a.id !== id))
    save(PLANS_KEY, storage.getPlans().filter(p => p.athleteId !== id))
  },

  getPlans(): YearlyPlan[] {
    return load<YearlyPlan[]>(PLANS_KEY, [])
  },
  getPlan(id: string): YearlyPlan | undefined {
    return storage.getPlans().find(p => p.id === id)
  },
  savePlan(plan: YearlyPlan): void {
    const all = storage.getPlans()
    const idx = all.findIndex(p => p.id === plan.id)
    if (idx >= 0) all[idx] = plan
    else all.push(plan)
    save(PLANS_KEY, all)
  },
  deletePlan(id: string): void {
    save(PLANS_KEY, storage.getPlans().filter(p => p.id !== id))
  },

  getGlobalEvents(): GlobalEvent[] {
    return load<GlobalEvent[]>(GLOBAL_EVENTS_KEY, [])
  },
  saveGlobalEvent(event: GlobalEvent): void {
    const all = storage.getGlobalEvents()
    const idx = all.findIndex(e => e.id === event.id)
    if (idx >= 0) all[idx] = event
    else all.push(event)
    save(GLOBAL_EVENTS_KEY, all)
  },
  deleteGlobalEvent(id: string): void {
    save(GLOBAL_EVENTS_KEY, storage.getGlobalEvents().filter(e => e.id !== id))
  },
}
