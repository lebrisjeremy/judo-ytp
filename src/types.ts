export type SeasonPhase =
  | 'forge'
  | 'sculpt'
  | 'conversion'
  | 'sharpening'
  | 'battle'
  | 'transition'

export type TrainingCycle = 'DEV1' | 'DEV2' | 'SHARPENING' | 'REST' | 'COMPETITION'

// 6 weight training cycles — Bompa-based judo S&C periodization
export type WeightCycle =
  | 'reathletisation'    // GPP rebuild, light loads
  | 'strength-endurance' // High reps, 50-65% 1RM, muscular base
  | 'max-strength'       // 85-95% 1RM, 3-5 reps, peak force
  | 'power'              // Explosive 30-60% 1RM, speed-strength
  | 'reactive'           // Plyometric/reactive — convert strength to judo power
  | 'maintenance'        // Minimal load, preserve gains during competition

// 6 cardio cycles — energy-system periodization for judo
export type CardioCycle =
  | 'aerobic-base'        // Long slow work, HR 65-75%, build aerobic engine
  | 'aerobic-power'       // Lactate threshold, HR 75-85%, aerobic ceiling
  | 'lactic-capacity'     // Lactate tolerance, 3-5 min efforts, HR 85-90%
  | 'lactic-power'        // Short high-intensity, 1-3 min, repeat sprints
  | 'alactic-power'       // Max anaerobic, <10s efforts, full recovery
  | 'speed-coordination'  // Neural/technical speed, low volume, high quality

export type CompType = 'development' | 'medium' | 'target' | 'camp'

export interface WeeklyTemplate {
  technicalPerWeek: number
  randoriPerWeek: number
  strengthCondPerWeek: number
}

export const DEFAULT_TEMPLATE: WeeklyTemplate = {
  technicalPerWeek: 2,
  randoriPerWeek: 3,
  strengthCondPerWeek: 2,
}

export interface Competition {
  name: string
  importance: 1 | 2 | 3 | 4 | 5
  type: CompType
  matchCount?: number
  location?: string
}

export interface SessionCounts {
  randori: number
  technical: number
  strengthCond: number
  physicalTesting: boolean
  tournament: boolean
}

export interface Week {
  weekNumber: number
  startDate: string
  endDate: string

  seasonPhase: SeasonPhase
  cycle?: TrainingCycle

  volume: 1 | 2 | 3 | 4 | 5
  intensity: 1 | 2 | 3 | 4 | 5
  physicalTestingProposed?: boolean

  weekEvent?: Competition
  weekendEvent?: Competition

  sessions?: SessionCounts

  weightCycle?: WeightCycle
  cardioCycle?: CardioCycle

  mandalaFocus?: string
  notes?: string
  location?: 'home' | 'travel' | 'camp'
  travelNote?: 'travel-before' | 'travel-after'
}

export type AthleteEventType = 'competition' | 'camp'

export interface AthleteEvent {
  id: string
  name: string
  startDate: string
  endDate?: string
  type: AthleteEventType
  importance: 1 | 2 | 3 | 4 | 5
  location?: string
  notes?: string
  travelBefore?: number
  travelAfter?: number
}

// Global reusable event — created once, shared across athletes
export interface GlobalEvent {
  id: string
  name: string
  type: AthleteEventType
  startDate: string
  endDate?: string
  location?: string
  travelBefore?: number
  travelAfter?: number
  notes?: string
}

// Per-athlete assignment — importance and travel overrides are athlete-specific
export interface AthleteEventRef {
  eventId: string
  importance: 1 | 2 | 3 | 4 | 5
  travelBefore?: number  // overrides GlobalEvent.travelBefore when set
  travelAfter?: number   // overrides GlobalEvent.travelAfter when set
}

// Resolve refs + global events → AthleteEvent[] (the format autoplan expects)
export function resolveAthleteEvents(
  refs: AthleteEventRef[],
  globalEvents: GlobalEvent[],
): AthleteEvent[] {
  return refs.flatMap(ref => {
    const ge = globalEvents.find(e => e.id === ref.eventId)
    if (!ge) return []
    return [{
      id: ref.eventId,
      name: ge.name,
      type: ge.type,
      startDate: ge.startDate,
      endDate: ge.endDate,
      location: ge.location,
      notes: ge.notes,
      importance: ref.importance,
      travelBefore: ref.travelBefore ?? ge.travelBefore,
      travelAfter: ref.travelAfter ?? ge.travelAfter,
    } satisfies AthleteEvent]
  })
}

export interface Athlete {
  id: string
  name: string
  weightClass: string
  team?: string
  club?: string
  level?: 'cadet' | 'junior' | 'senior' | 'provincial1' | 'provincial2' | 'elite'
  trainingAge?: number
  showWeightCycles?: boolean
  showCardioCycles?: boolean
  eventRefs?: AthleteEventRef[]   // replaces events — references to GlobalEvent
  events?: AthleteEvent[]          // legacy field — auto-migrated on first load
}

export interface YearlyPlan {
  id: string
  athleteId: string
  title: string
  startDate: string
  weeks: Week[]
  planMode: 'simple' | 'detailed'
  weeklyTemplate?: WeeklyTemplate
  mainGoalEventId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const PHASE_LABELS: Record<SeasonPhase, string> = {
  forge: 'Forge',
  sculpt: 'Sculpt',
  conversion: 'Conversion',
  sharpening: 'Sharpening',
  battle: 'Battle',
  transition: 'Transition / Recovery',
}

export const PHASE_COLORS: Record<SeasonPhase, string> = {
  forge: '#f97316',
  sculpt: '#f59e0b',
  conversion: '#3b82f6',
  sharpening: '#8b5cf6',
  battle: '#ef4444',
  transition: '#10b981',
}

export const PHASE_BG: Record<SeasonPhase, string> = {
  forge: 'bg-orange-400',
  sculpt: 'bg-amber-400',
  conversion: 'bg-blue-500',
  sharpening: 'bg-purple-500',
  battle: 'bg-red-500',
  transition: 'bg-emerald-500',
}

export const VOLUME_LABELS: Record<number, string> = {
  1: '1 – Very Light (30-45 min / Technical / Recovery)',
  2: '2 – Low (60-75 min / 4-6 rounds / Taper)',
  3: '3 – Moderate (75-90 min / 6-8 rounds)',
  4: '4 – High (90-120 min / 8-12 rounds)',
  5: '5 – Very High (2+ hrs / 12+ randoris / camp)',
}

export const INTENSITY_LABELS: Record<number, string> = {
  1: '1 – Very Light: movement only, no resistance',
  2: '2 – Light: technical, low grip resistance',
  3: '3 – Moderate: situational randori, controlled',
  4: '4 – Hard: real randori, full grip fighting',
  5: '5 – Max: competition intensity, full commitment',
}

export const COMP_TYPE_COLORS: Record<CompType, string> = {
  development: 'bg-yellow-200 border-yellow-400 text-yellow-900',
  medium: 'bg-orange-300 border-orange-500 text-orange-900',
  target: 'bg-red-500 border-red-700 text-white',
  camp: 'bg-blue-200 border-blue-400 text-blue-900',
}

export const IMPORTANCE_STARS = ['★', '★★', '★★★', '★★★★', '★★★★★']

export const LEVEL_LABELS: Record<number, string> = {
  1: 'L1', 2: 'L2', 3: 'M1', 4: 'M2', 5: 'H1',
}

export const WEIGHT_CYCLE_LABELS: Record<WeightCycle, string> = {
  'reathletisation':    'Reathletisation',
  'strength-endurance': 'Strength Endurance',
  'max-strength':       'Max Strength',
  'power':              'Power',
  'reactive':           'Reactive / Speed Strength',
  'maintenance':        'Maintenance',
}

export const CARDIO_CYCLE_LABELS: Record<CardioCycle, string> = {
  'aerobic-base':       'Aerobic Base',
  'aerobic-power':      'Aerobic Power',
  'lactic-capacity':    'Lactic Capacity',
  'lactic-power':       'Lactic Power',
  'alactic-power':      'Alactic Power',
  'speed-coordination': 'Speed / Coordination',
}

export const WEIGHT_CYCLE_SHORT: Record<WeightCycle, string> = {
  'reathletisation':    'Rth',
  'strength-endurance': 'StrE',
  'max-strength':       'MxS',
  'power':              'Pow',
  'reactive':           'Rct',
  'maintenance':        'Mnt',
}

export const CARDIO_CYCLE_SHORT: Record<CardioCycle, string> = {
  'aerobic-base':       'AerB',
  'aerobic-power':      'AerP',
  'lactic-capacity':    'LacC',
  'lactic-power':       'LacP',
  'alactic-power':      'AlcP',
  'speed-coordination': 'Spd',
}

export const WEIGHT_CYCLE_COLORS: Record<WeightCycle, string> = {
  'reathletisation':    '#94a3b8',
  'strength-endurance': '#22c55e',
  'max-strength':       '#ef4444',
  'power':              '#3b82f6',
  'reactive':           '#a855f7',
  'maintenance':        '#6b7280',
}

export const CARDIO_CYCLE_COLORS: Record<CardioCycle, string> = {
  'aerobic-base':       '#22c55e',
  'aerobic-power':      '#84cc16',
  'lactic-capacity':    '#f59e0b',
  'lactic-power':       '#f97316',
  'alactic-power':      '#ef4444',
  'speed-coordination': '#8b5cf6',
}
