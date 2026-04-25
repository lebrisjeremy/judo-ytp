import jsPDF from 'jspdf'
import type { YearlyPlan, Athlete } from '../types'
import { PHASE_LABELS, PHASE_COLORS, VOLUME_LABELS, INTENSITY_LABELS, IMPORTANCE_STARS,
  WEIGHT_CYCLE_SHORT, WEIGHT_CYCLE_COLORS,
  CARDIO_CYCLE_SHORT, CARDIO_CYCLE_COLORS } from '../types'
import { weekRange, monthOf } from './dates'

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function drawBarScale(
  doc: jsPDF,
  x: number,
  y: number,
  colW: number,
  rowH: number,
  level: number,
  filledRgb: [number, number, number]
): void {
  const nSq = 5
  const labelH = Math.max(1.8, rowH * 0.12)
  const barH = rowH - labelH
  const gap = 0.3
  const sqH = (barH - (nSq - 1) * gap) / nSq
  const sqW = Math.max(colW - 0.6, 0.2)

  // Draw 5 squares top (n=5) to bottom (n=1); fill up to level
  for (let n = nSq; n >= 1; n--) {
    const sqY = y + (nSq - n) * (sqH + gap)
    if (n <= level) {
      doc.setFillColor(filledRgb[0], filledRgb[1], filledRgb[2])
    } else {
      doc.setFillColor(229, 231, 235)
    }
    doc.rect(x + 0.3, sqY, sqW, sqH, 'F')
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(Math.max(3.5, rowH * 0.18))
  doc.setTextColor(74, 85, 104)
  doc.text(String(level), x + colW / 2, y + barH + labelH * 0.85, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
}

function drawYearGridPage(doc: jsPDF, plan: YearlyPlan, athlete: Athlete): void {
  const pageW = 297
  const margin = 10
  const usableW = pageW - margin * 2
  const labelW = 24
  const weeks = plan.weeks
  const colW = Math.min(5.0, (usableW - labelW) / weeks.length)
  const rowH = 5.5
  const volIntH = rowH * 4  // 22mm — 4x taller for volume/intensity

  // Event row: tall enough for longest name as rotated text
  const maxEventLen = Math.max(0, ...weeks.map(w => {
    const evt = w.weekendEvent ?? w.weekEvent
    return (evt?.name ?? '').length
  }))
  const pdfEventRowH = weeks.some(w => w.weekendEvent ?? w.weekEvent)
    ? Math.max(8, maxEventLen * 0.55 + 3)
    : rowH

  let y = margin

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Year Grid — Training Plan Overview', margin, y + 7)
  y += 12

  function rowLabel(text: string, h: number = rowH) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(80, 80, 80)
    doc.text(text, margin + labelW - 1, y + h / 2 + 0.5, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  // Month headers
  let curMonth = ''
  weeks.forEach((w, i) => {
    const m = monthOf(w.startDate).slice(0, 3).toUpperCase()
    const x = margin + labelW + i * colW
    if (m !== curMonth) {
      curMonth = m
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(4.5)
      doc.setTextColor(100, 100, 100)
      doc.text(m, x + 0.4, y + rowH * 0.72)
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.line(x, y, x, y + rowH)
    }
  })
  y += rowH

  // Week numbers row (every 4th week)
  weeks.forEach((w, i) => {
    const x = margin + labelW + i * colW
    if (i === 0 || (i + 1) % 4 === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(4)
      doc.setTextColor(160, 160, 160)
      doc.text(String(w.weekNumber), x + colW / 2, y + rowH * 0.72, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }
  })
  y += rowH

  // Phase
  rowLabel('Phase')
  weeks.forEach((w, i) => {
    const x = margin + labelW + i * colW
    const rgb = hexToRgb(PHASE_COLORS[w.seasonPhase])
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(x + 0.1, y + 0.4, Math.max(colW - 0.2, 0.2), rowH - 0.8, 'F')
  })
  y += rowH + 0.5

  // Volume (bar scale — 4x taller)
  rowLabel('Volume', volIntH)
  weeks.forEach((w, i) => {
    drawBarScale(doc, margin + labelW + i * colW, y, colW, volIntH, w.volume, [34, 197, 94])
  })
  y += volIntH + 0.5

  // Intensity (bar scale — 4x taller)
  rowLabel('Intensity', volIntH)
  weeks.forEach((w, i) => {
    drawBarScale(doc, margin + labelW + i * colW, y, colW, volIntH, w.intensity, [59, 130, 246])
  })
  y += volIntH + 0.5

  // Events — filled column with rotated event name text
  rowLabel('Events', pdfEventRowH)
  weeks.forEach((w, i) => {
    const x = margin + labelW + i * colW
    const evt = w.weekendEvent ?? w.weekEvent
    if (evt) {
      const color = evt.type === 'target' ? '#ef4444'
        : evt.type === 'medium' ? '#f97316'
        : evt.type === 'camp' ? '#3b82f6'
        : '#f59e0b'
      const rgb = hexToRgb(color)
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.rect(x + 0.1, y, Math.max(colW - 0.2, 0.2), pdfEventRowH, 'F')
      doc.setFontSize(4.5)
      if (evt.type === 'development') {
        doc.setTextColor(31, 41, 55)
      } else {
        doc.setTextColor(255, 255, 255)
      }
      doc.text(evt.name, x + colW / 2, y + pdfEventRowH - 1.5, { angle: 90 })
      doc.setTextColor(0, 0, 0)
    } else if (w.physicalTestingProposed || w.sessions?.physicalTesting) {
      doc.setFillColor(6, 182, 212)
      doc.rect(x + 0.1, y, Math.max(colW - 0.2, 0.2), pdfEventRowH, 'F')
      doc.setFontSize(4)
      doc.setTextColor(255, 255, 255)
      doc.text('T', x + colW / 2, y + pdfEventRowH / 2 + 1, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }
  })
  y += pdfEventRowH + 0.5

  // Travel row (only when any week has travel)
  if (weeks.some(w => w.travelNote)) {
    rowLabel('Travel')
    weeks.forEach((w, i) => {
      if (!w.travelNote) return
      const x = margin + labelW + i * colW
      doc.setFillColor(148, 163, 184)
      doc.rect(x + 0.2, y + 0.8, Math.max(colW - 0.4, 0.2), rowH - 1.6, 'F')
      doc.setFontSize(3)
      doc.setTextColor(255, 255, 255)
      doc.text(w.travelNote === 'travel-before' ? 'TR' : 'RT', x + colW / 2, y + rowH * 0.72, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    })
    y += rowH + 0.5
  }

  if (plan.planMode === 'detailed') {
    const sessionRows = [
      { key: 'randori' as const, label: 'Randori' },
      { key: 'technical' as const, label: 'Technical' },
      { key: 'strengthCond' as const, label: 'S&C' },
    ]
    sessionRows.forEach(({ key, label }) => {
      rowLabel(label)
      weeks.forEach((w, i) => {
        const val = w.sessions?.[key]
        if (val) {
          const x = margin + labelW + i * colW
          doc.setFontSize(4)
          doc.setTextColor(60, 60, 60)
          doc.text(String(val), x + colW / 2, y + rowH * 0.72, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
      })
      y += rowH
    })

  }

  // Weight Cycles
  if (athlete.showWeightCycles) {
    rowLabel('Weight')
    weeks.forEach((w, i) => {
      if (!w.weightCycle) return
      const x = margin + labelW + i * colW
      const rgb = hexToRgb(WEIGHT_CYCLE_COLORS[w.weightCycle])
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.rect(x + 0.1, y + 0.4, Math.max(colW - 0.2, 0.2), rowH - 0.8, 'F')
      doc.setFontSize(3)
      doc.setTextColor(255, 255, 255)
      doc.text(WEIGHT_CYCLE_SHORT[w.weightCycle], x + colW / 2, y + rowH * 0.72, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    })
    y += rowH
  }

  // Cardio Cycles
  if (athlete.showCardioCycles) {
    rowLabel('Cardio')
    weeks.forEach((w, i) => {
      if (!w.cardioCycle) return
      const x = margin + labelW + i * colW
      const rgb = hexToRgb(CARDIO_CYCLE_COLORS[w.cardioCycle])
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.rect(x + 0.1, y + 0.4, Math.max(colW - 0.2, 0.2), rowH - 0.8, 'F')
      doc.setFontSize(3)
      doc.setTextColor(255, 255, 255)
      doc.text(CARDIO_CYCLE_SHORT[w.cardioCycle], x + colW / 2, y + rowH * 0.72, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    })
    y += rowH
  }

  // Phase legend at bottom
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('Phases:', margin, y)
  let lx = margin + 12
  Object.entries(PHASE_LABELS).forEach(([phase, label]) => {
    const rgb = hexToRgb(PHASE_COLORS[phase as keyof typeof PHASE_COLORS])
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(lx, y - 3, 6, 3.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(60, 60, 60)
    doc.text(label.split(' ')[0], lx + 7, y)
    lx += label.split(' ')[0].length * 2.5 + 10
    doc.setTextColor(0, 0, 0)
  })
}

export function exportToPdf(plan: YearlyPlan, athlete: Athlete) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = 297
  const margin = 10
  const usableW = pageW - margin * 2

  // Page 1: Year Grid
  drawYearGridPage(doc, plan, athlete)

  // Page 2+: Weekly table
  doc.addPage()
  let y = margin

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${athlete.name} — ${athlete.weightClass} — ${plan.title}`, margin, y + 6)
  y += 12

  if (athlete.team || athlete.club) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text([athlete.team, athlete.club].filter(Boolean).join(' · '), margin, y)
    y += 6
    doc.setTextColor(0)
  }

  const cols = plan.planMode === 'detailed'
    ? [
        { label: '#', w: 8 },
        { label: 'Dates', w: 36 },
        { label: 'Month', w: 20 },
        { label: 'Phase', w: 28 },
        { label: 'Volume', w: 54 },
        { label: 'Intensity', w: 54 },
        { label: 'Events', w: 50 },
        { label: 'Focus', w: 9 },
      ]
    : [
        { label: '#', w: 8 },
        { label: 'Dates', w: 40 },
        { label: 'Month', w: 22 },
        { label: 'Phase', w: 32 },
        { label: 'Volume', w: 55 },
        { label: 'Intensity', w: 55 },
        { label: 'Events', w: 55 },
        { label: 'Focus / Notes', w: 10 },
      ]

  const rowH = 6
  const headerH = 7

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(240, 240, 245)
  doc.rect(margin, y, usableW, headerH, 'F')
  let x = margin
  cols.forEach(c => { doc.text(c.label, x + 1, y + 5); x += c.w })
  y += headerH

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)

  for (const w of plan.weeks) {
    if (y + rowH > 200) {
      doc.addPage()
      y = margin
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 245)
      doc.rect(margin, y, usableW, headerH, 'F')
      let hx = margin
      cols.forEach(c => { doc.text(c.label, hx + 1, y + 5); hx += c.w })
      y += headerH
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
    }

    const bgColor = w.weekNumber % 2 === 0 ? [248, 250, 252] : [255, 255, 255]
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
    doc.rect(margin, y, usableW, rowH, 'F')

    const rgb = hexToRgb(PHASE_COLORS[w.seasonPhase])
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(margin, y, 2, rowH, 'F')

    doc.setTextColor(60, 60, 60)
    x = margin

    const cells = plan.planMode === 'detailed'
      ? [
          String(w.weekNumber),
          weekRange(w.startDate, w.endDate),
          monthOf(w.startDate),
          PHASE_LABELS[w.seasonPhase],
          `${w.volume}/5 — ${VOLUME_LABELS[w.volume].split(' – ')[1]?.slice(0, 22) ?? ''}`,
          `${w.intensity}/5 — ${INTENSITY_LABELS[w.intensity].split(': ')[1]?.slice(0, 18) ?? ''}`,
          [
            ...[w.weekEvent, w.weekendEvent].filter(Boolean).map(e => `${e!.name} ${IMPORTANCE_STARS[e!.importance - 1]}`),
            ...(w.travelNote ? [w.travelNote === 'travel-before' ? 'Travel' : 'Travel/Recovery'] : []),
          ].join(', '),
          w.mandalaFocus?.slice(0, 18) ?? '',
        ]
      : [
          String(w.weekNumber),
          weekRange(w.startDate, w.endDate),
          monthOf(w.startDate),
          PHASE_LABELS[w.seasonPhase],
          `${w.volume}/5 — ${VOLUME_LABELS[w.volume].split(' – ')[1]?.slice(0, 22) ?? ''}`,
          `${w.intensity}/5 — ${INTENSITY_LABELS[w.intensity].split(': ')[1]?.slice(0, 22) ?? ''}`,
          [
            ...[w.weekEvent, w.weekendEvent].filter(Boolean).map(e => `${e!.name} ${IMPORTANCE_STARS[e!.importance - 1]}`),
            ...(w.travelNote ? [w.travelNote === 'travel-before' ? 'Travel' : 'Travel/Recovery'] : []),
          ].join(', '),
          (w.mandalaFocus ?? w.notes ?? '').slice(0, 10),
        ]

    cells.forEach((cell, ci) => {
      const col = cols[ci]
      if (!col) return
      doc.text(String(cell), x + 1, y + 4, { maxWidth: col.w - 2 })
      x += col.w
    })

    y += rowH
  }

  // Legend page
  doc.addPage()
  y = margin
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Legend', margin, y + 6)
  y += 12

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Season Phases:', margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  const phases: Array<[string, string]> = [
    ['Forge', 'Build capacity — high volume, foundational work'],
    ['Sculpt', 'Refine technique under load'],
    ['Conversion', 'Turn base into speed and power'],
    ['Sharpening', 'Make it fight-ready'],
    ['Battle', 'Competition week — perform'],
    ['Transition', 'Recovery and mental reset'],
  ]
  phases.forEach(([name, desc]) => {
    const ph = name.toLowerCase() as keyof typeof PHASE_COLORS
    const rgb = hexToRgb(PHASE_COLORS[ph] ?? '#888888')
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(margin, y - 3, 12, 4, 'F')
    doc.setTextColor(60)
    doc.text(`${name}: ${desc}`, margin + 14, y)
    doc.setTextColor(0)
    y += 5
  })

  y += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Volume & Intensity Scale (1–5 squares):', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  Object.entries(VOLUME_LABELS).forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, margin, y)
    y += 4.5
  })

  doc.save(`YTP_${athlete.name.replace(/\s+/g, '_')}_${plan.title.replace(/\s+/g, '_')}.pdf`)
}
