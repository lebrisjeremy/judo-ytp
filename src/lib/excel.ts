import * as XLSX from 'xlsx'
import type { YearlyPlan, Athlete } from '../types'
import { PHASE_LABELS, VOLUME_LABELS, INTENSITY_LABELS, IMPORTANCE_STARS,
  WEIGHT_CYCLE_LABELS, CARDIO_CYCLE_LABELS } from '../types'
import { weekRange, monthOf } from './dates'

export function exportToExcel(plan: YearlyPlan, athlete: Athlete) {
  const wb = XLSX.utils.book_new()

  // --- Sheet 1: Year Plan ---
  const cycleHeaders = [
    ...(athlete.showWeightCycles ? ['Weight Cycle'] : []),
    ...(athlete.showCardioCycles ? ['Cardio Cycle'] : []),
  ]
  const headers = plan.planMode === 'detailed'
    ? ['Week', 'Dates', 'Month', 'Phase', 'Cycle', 'Volume', 'Intensity',
        'Randori', 'Technical', 'S&C', 'Physical Testing', ...cycleHeaders, 'Week Event', 'Importance', 'Weekend Event', 'Wknd Importance',
        'Matches', 'Location', 'Mandala Focus', 'Notes']
    : ['Week', 'Dates', 'Month', 'Phase', 'Volume', 'Intensity', ...cycleHeaders, 'Week Event', 'Importance', 'Weekend Event', 'Wknd Importance',
        'Matches', 'Location', 'Mandala Focus', 'Notes']

  const rows = plan.weeks.map(w => {
    const base = [
      w.weekNumber,
      weekRange(w.startDate, w.endDate),
      monthOf(w.startDate),
      PHASE_LABELS[w.seasonPhase],
    ]
    if (plan.planMode === 'detailed') {
      base.push(
        w.cycle ?? '',
        VOLUME_LABELS[w.volume],
        INTENSITY_LABELS[w.intensity],
        w.sessions?.randori ?? 0,
        w.sessions?.technical ?? 0,
        w.sessions?.strengthCond ?? 0,
        (w.sessions?.physicalTesting || w.physicalTestingProposed) ? 'X' : '',
      )
    } else {
      base.push(VOLUME_LABELS[w.volume], INTENSITY_LABELS[w.intensity])
    }
    if (athlete.showWeightCycles) base.push(w.weightCycle ? WEIGHT_CYCLE_LABELS[w.weightCycle] : '')
    if (athlete.showCardioCycles) base.push(w.cardioCycle ? CARDIO_CYCLE_LABELS[w.cardioCycle] : '')
    base.push(
      w.weekEvent?.name ?? '',
      w.weekEvent ? IMPORTANCE_STARS[w.weekEvent.importance - 1] : '',
      w.weekendEvent?.name ?? '',
      w.weekendEvent ? IMPORTANCE_STARS[w.weekendEvent.importance - 1] : '',
      (w.weekEvent?.matchCount ?? 0) + (w.weekendEvent?.matchCount ?? 0) || '',
      w.location ?? 'home',
      w.mandalaFocus ?? '',
      w.notes ?? '',
    )
    return base
  })

  const ws1 = XLSX.utils.aoa_to_sheet([
    [`Judo YTP — ${athlete.name} ${athlete.weightClass} — ${plan.title}`],
    [],
    headers,
    ...rows,
  ])

  ws1['!cols'] = headers.map((_, i) => ({ wch: i < 4 ? 20 : 15 }))
  XLSX.utils.book_append_sheet(wb, ws1, 'Year Plan')

  // --- Sheet 2: Year Grid (horizontal overview) ---
  const gridWeekRow = ['', ...plan.weeks.map(w => `W${w.weekNumber}`)]
  const gridDateRow = ['Dates', ...plan.weeks.map(w => `${w.startDate.slice(5, 10)}`)]
  const gridPhaseRow = ['Phase', ...plan.weeks.map(w => PHASE_LABELS[w.seasonPhase])]
  const gridVolRow = ['Volume', ...plan.weeks.map(w => w.volume)]
  const gridIntRow = ['Intensity', ...plan.weeks.map(w => w.intensity)]
  const gridEventRow = ['Events', ...plan.weeks.map(w => {
    const evt = w.weekEvent ?? w.weekendEvent
    return evt ? `${evt.name} ${IMPORTANCE_STARS[evt.importance - 1]}` : ''
  })]
  const gridTestRow = ['Testing', ...plan.weeks.map(w =>
    (w.sessions?.physicalTesting || w.physicalTestingProposed) ? 'T' : ''
  )]
  const gridTravelRow = ['Travel', ...plan.weeks.map(w =>
    w.travelNote === 'travel-before' ? 'Travel' : w.travelNote === 'travel-after' ? 'Travel/Recovery' : ''
  )]

  const gridRows = [
    [`Year Grid — ${athlete.name} ${athlete.weightClass} — ${plan.title}`],
    [],
    gridWeekRow,
    gridDateRow,
    gridPhaseRow,
    gridVolRow,
    gridIntRow,
    gridEventRow,
    gridTestRow,
    gridTravelRow,
  ]
  if (athlete.showWeightCycles) {
    gridRows.push(['Weight Cycle', ...plan.weeks.map(w =>
      w.weightCycle ? WEIGHT_CYCLE_LABELS[w.weightCycle] : ''
    )])
  }
  if (athlete.showCardioCycles) {
    gridRows.push(['Cardio Cycle', ...plan.weeks.map(w =>
      w.cardioCycle ? CARDIO_CYCLE_LABELS[w.cardioCycle] : ''
    )])
  }
  const ws3 = XLSX.utils.aoa_to_sheet(gridRows)
  ws3['!cols'] = [{ wch: 12 }, ...plan.weeks.map(() => ({ wch: 8 }))]
  XLSX.utils.book_append_sheet(wb, ws3, 'Year Grid')

  // --- Sheet 3: Legend ---
  const legend: (string | number)[][] = [
    ['SEASON PHASES'], ['Phase', 'Description'],
    ['Forge', 'Build capacity — high volume, foundational work'],
    ['Sculpt', 'Refine technique under load'],
    ['Conversion', 'Turn base into speed and power'],
    ['Sharpening', 'Make it fight-ready — taper volume, keep intensity'],
    ['Battle', 'Perform — competition week'],
    ['Transition', 'Recovery and mental reset'],
    [],
    ['VOLUME SCALE'],
    ...Object.entries(VOLUME_LABELS).map(([k, v]) => [k, v]),
    [],
    ['INTENSITY SCALE'],
    ...Object.entries(INTENSITY_LABELS).map(([k, v]) => [k, v]),
    [],
    ['EVENT IMPORTANCE'],
    ['★', 'Local development event'],
    ['★★', 'Development priority'],
    ['★★★', 'Development with load priority'],
    ['★★★★', 'Performance based priority'],
    ['★★★★★', 'Major performance target'],
    [],
    ['WEIGHT TRAINING CYCLES (Dev1 → Dev2 → Sharpening → Competition)'],
    ['Reathletisation',    'Int 1 / Vol 2 — GPP rebuild, general exercises, light loads'],
    ['Strength Endurance', 'Int 2 / Vol 4 — 15-20 reps, 50-65% 1RM, muscular base'],
    ['Max Strength',       'Int 5 / Vol 3 — 3-5 reps, 85-95% 1RM, peak force'],
    ['Power',              'Int 4 / Vol 3 — explosive 30-60% 1RM, speed-strength'],
    ['Reactive',           'Int 5 / Vol 2 — plyometric/reactive, neural sharpening'],
    ['Maintenance',        'Int 2 / Vol 1 — minimal load, preserve gains during competition'],
    [],
    ['CARDIO CYCLES (Dev1 → Dev2 → Sharpening → Competition)'],
    ['Aerobic Base',       'Int 2 / Vol 4 — HR 65-75%, long continuous efforts, aerobic engine'],
    ['Aerobic Power',      'Int 3 / Vol 4 — HR 75-85%, lactate threshold, aerobic ceiling'],
    ['Lactic Capacity',    'Int 4 / Vol 3 — HR 85-90%, 3-5 min efforts, lactate tolerance'],
    ['Lactic Power',       'Int 5 / Vol 3 — 1-3 min max efforts, repeat sprint capacity'],
    ['Alactic Power',      'Int 5 / Vol 2 — <10s maximal efforts, full recovery, ATP-PC system'],
    ['Speed / Coordination','Int 5 / Vol 1 — neural/technical speed, low volume, high quality'],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(legend)
  ws2['!cols'] = [{ wch: 20 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Legend')

  XLSX.writeFile(wb, `YTP_${athlete.name.replace(/\s+/g, '_')}_${plan.title.replace(/\s+/g, '_')}.xlsx`)
}
