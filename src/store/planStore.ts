import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Athlete, YearlyPlan, Week, GlobalEvent } from '../types'
import { resolveAthleteEvents } from '../types'
import { generateWeeks, computePlanLength } from '../lib/dates'
import { autoGenerateWeeks } from '../lib/autoplan'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function fetchAthletes(userId: string): Promise<Athlete[]> {
  const { data } = await supabase.from('athletes').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as Athlete)
}
async function fetchPlans(userId: string): Promise<YearlyPlan[]> {
  const { data } = await supabase.from('yearly_plans').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as YearlyPlan)
}
async function fetchGlobalEvents(userId: string): Promise<GlobalEvent[]> {
  const { data } = await supabase.from('global_events').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as GlobalEvent)
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface PlanStore {
  user: User | null
  loading: boolean
  athletes: Athlete[]
  plans: YearlyPlan[]
  globalEvents: GlobalEvent[]
  activePlanId: string | null

  init: () => void
  setUser: (user: User | null) => void
  loadAll: (userId: string) => Promise<void>

  saveAthlete: (a: Athlete) => Promise<void>
  deleteAthlete: (id: string) => Promise<void>
  saveGlobalEvent: (event: GlobalEvent) => Promise<void>
  deleteGlobalEvent: (id: string) => Promise<void>

  createPlan: (athleteId: string, title: string, startDate: string, autoGenerate?: boolean) => Promise<string>
  regeneratePlan: (planId: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  setActivePlan: (id: string | null) => void
  updateWeek: (planId: string, weekNumber: number, patch: Partial<Week>) => Promise<void>
  updatePlanMode: (planId: string, mode: 'simple' | 'detailed') => Promise<void>
  updatePlanMeta: (planId: string, patch: Partial<Pick<YearlyPlan, 'title' | 'notes'>>) => Promise<void>
  importAthlete: (athlete: Athlete, plans: YearlyPlan[], newGlobalEvents: GlobalEvent[]) => Promise<void>
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const usePlanStore = create<PlanStore>((set, get) => ({
  user: null,
  loading: true,
  athletes: [],
  plans: [],
  globalEvents: [],
  activePlanId: null,

  init() {
    // Listen for auth state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      set({ user })
      if (user) get().loadAll(user.id)
      else set({ loading: false })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) get().loadAll(user.id)
      else set({ athletes: [], plans: [], globalEvents: [], loading: false })
    })
  },

  setUser(user) {
    set({ user })
  },

  async loadAll(userId) {
    set({ loading: true })
    const [athletes, plans, globalEvents] = await Promise.all([
      fetchAthletes(userId),
      fetchPlans(userId),
      fetchGlobalEvents(userId),
    ])
    set({ athletes, plans, globalEvents, loading: false })
  },

  async saveAthlete(athlete) {
    const userId = get().user?.id
    if (!userId) return
    await supabase.from('athletes').upsert({ id: athlete.id, user_id: userId, data: athlete })
    set({ athletes: await fetchAthletes(userId) })
  },

  async deleteAthlete(id) {
    const userId = get().user?.id
    if (!userId) return
    await supabase.from('athletes').delete().eq('id', id).eq('user_id', userId)
    await supabase.from('yearly_plans').delete().eq('athlete_id', id).eq('user_id', userId)
    const [athletes, plans] = await Promise.all([fetchAthletes(userId), fetchPlans(userId)])
    set({ athletes, plans })
  },

  async saveGlobalEvent(event) {
    const userId = get().user?.id
    if (!userId) return
    await supabase.from('global_events').upsert({ id: event.id, user_id: userId, data: event })
    set({ globalEvents: await fetchGlobalEvents(userId) })
  },

  async deleteGlobalEvent(id) {
    const userId = get().user?.id
    if (!userId) return
    await supabase.from('global_events').delete().eq('id', id).eq('user_id', userId)
    set({ globalEvents: await fetchGlobalEvents(userId) })
  },

  async createPlan(athleteId, title, startDate, autoGenerate = false) {
    const userId = get().user?.id
    if (!userId) return ''
    const id = crypto.randomUUID()
    const athlete = get().athletes.find(a => a.id === athleteId)
    const events = resolveAthleteEvents(athlete?.eventRefs ?? [], get().globalEvents)
    const count = computePlanLength(startDate, events)
    const weeks = autoGenerate && events.length > 0
      ? autoGenerateWeeks(startDate, events, count, undefined, athlete?.trainingAge ?? 2, athlete?.level ?? 'junior')
      : generateWeeks(startDate, count)
    const plan: YearlyPlan = {
      id, athleteId, title, startDate, weeks,
      planMode: 'simple',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }
    await supabase.from('yearly_plans').insert({ id, user_id: userId, athlete_id: athleteId, data: plan })
    set({ plans: await fetchPlans(userId) })
    return id
  },

  async regeneratePlan(planId) {
    const userId = get().user?.id
    if (!userId) return
    const plan = get().plans.find(p => p.id === planId)
    if (!plan) return
    const athlete = get().athletes.find(a => a.id === plan.athleteId)
    const events = resolveAthleteEvents(athlete?.eventRefs ?? [], get().globalEvents)
    const count = computePlanLength(plan.startDate, events, plan.mainGoalEventId)
    const weeks = events.length > 0
      ? autoGenerateWeeks(plan.startDate, events, count, plan.weeklyTemplate, athlete?.trainingAge ?? 2, athlete?.level ?? 'junior')
      : generateWeeks(plan.startDate, count)
    const updated: YearlyPlan = { ...plan, weeks, updatedAt: format(new Date(), 'yyyy-MM-dd') }
    await supabase.from('yearly_plans').update({ data: updated }).eq('id', planId).eq('user_id', userId)
    set({ plans: await fetchPlans(userId) })
  },

  async deletePlan(id) {
    const userId = get().user?.id
    if (!userId) return
    await supabase.from('yearly_plans').delete().eq('id', id).eq('user_id', userId)
    set({
      plans: await fetchPlans(userId),
      activePlanId: get().activePlanId === id ? null : get().activePlanId,
    })
  },

  setActivePlan(id) {
    set({ activePlanId: id })
  },

  async updateWeek(planId, weekNumber, patch) {
    const userId = get().user?.id
    if (!userId) return
    const plan = get().plans.find(p => p.id === planId)
    if (!plan) return
    const updated: YearlyPlan = {
      ...plan,
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
      weeks: plan.weeks.map(w => w.weekNumber === weekNumber ? { ...w, ...patch } : w),
    }
    await supabase.from('yearly_plans').update({ data: updated }).eq('id', planId).eq('user_id', userId)
    set({ plans: get().plans.map(p => p.id === planId ? updated : p) })
  },

  async updatePlanMode(planId, mode) {
    const userId = get().user?.id
    if (!userId) return
    const plan = get().plans.find(p => p.id === planId)
    if (!plan) return
    const updated = { ...plan, planMode: mode, updatedAt: format(new Date(), 'yyyy-MM-dd') }
    await supabase.from('yearly_plans').update({ data: updated }).eq('id', planId).eq('user_id', userId)
    set({ plans: get().plans.map(p => p.id === planId ? updated : p) })
  },

  async updatePlanMeta(planId, patch) {
    const userId = get().user?.id
    if (!userId) return
    const plan = get().plans.find(p => p.id === planId)
    if (!plan) return
    const updated = { ...plan, ...patch, updatedAt: format(new Date(), 'yyyy-MM-dd') }
    await supabase.from('yearly_plans').update({ data: updated }).eq('id', planId).eq('user_id', userId)
    set({ plans: get().plans.map(p => p.id === planId ? updated : p) })
  },

  async importAthlete(athlete, plans, newGlobalEvents) {
    const userId = get().user?.id
    if (!userId) return
    await Promise.all([
      ...newGlobalEvents.map(e =>
        supabase.from('global_events').upsert({ id: e.id, user_id: userId, data: e })
      ),
      supabase.from('athletes').upsert({ id: athlete.id, user_id: userId, data: athlete }),
      ...plans.map(p =>
        supabase.from('yearly_plans').upsert({ id: p.id, user_id: userId, athlete_id: p.athleteId, data: p })
      ),
    ])
    const [athletes, updatedPlans, globalEvents] = await Promise.all([
      fetchAthletes(userId),
      fetchPlans(userId),
      fetchGlobalEvents(userId),
    ])
    set({ athletes, plans: updatedPlans, globalEvents })
  },
}))
