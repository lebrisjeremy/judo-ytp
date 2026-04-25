import jsPDF from 'jspdf'
import type { GeneratedSession, Athlete, YearlyPlan } from '../types'
import { CARDIO_CYCLE_LABELS, WEIGHT_CYCLE_LABELS, PHASE_LABELS } from '../types'
import { weekRange } from './dates'

function cycleName(s: GeneratedSession): string {
  if (s.sessionType === 'cardio') {
    return CARDIO_CYCLE_LABELS[s.cycleName as keyof typeof CARDIO_CYCLE_LABELS] ?? s.cycleName
  }
  return WEIGHT_CYCLE_LABELS[s.cycleName as keyof typeof WEIGHT_CYCLE_LABELS] ?? s.cycleName
}

function buildDoc(sessions: GeneratedSession[], athlete: Athlete, plan: YearlyPlan): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const margin = 18
  const pageW = 216
  const usableW = pageW - margin * 2
  let y = margin
  let firstPage = true

  function newPageIfNeeded(needed = 14) {
    if (y + needed > 272) {
      doc.addPage()
      y = margin
    }
  }

  function sectionHeader(text: string) {
    newPageIfNeeded(10)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(text.toUpperCase(), margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
  }

  function bodyText(text: string, indent = 0) {
    const lines = doc.splitTextToSize(text, usableW - indent)
    lines.forEach((line: string) => {
      newPageIfNeeded(5)
      doc.setFontSize(6.5)
      doc.text(line, margin + indent, y)
      y += 4.5
    })
  }

  for (const session of sessions) {
    const week = plan.weeks.find(w => w.weekNumber === session.weekNumber)
    const c = session.content

    if (!firstPage) {
      doc.addPage()
      y = margin
    }
    firstPage = false

    // Session header block
    doc.setFillColor(245, 246, 250)
    doc.rect(margin, y, usableW, 22, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(c.title, margin + 3, y + 7)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 90, 90)
    const meta = [
      athlete.name,
      athlete.weightClass,
      week ? weekRange(week.startDate, week.endDate) : '',
      week ? `Phase: ${PHASE_LABELS[week.seasonPhase]}` : '',
      `Cycle: ${cycleName(session)}`,
      `~${c.estimatedDuration} min`,
    ].filter(Boolean).join('  ·  ')
    doc.text(meta, margin + 3, y + 14)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(60, 60, 60)
    const typeLabel = session.sessionType === 'cardio' ? 'Cardio' : 'Weight Training'
    doc.text(`${typeLabel} · Session ${session.sessionNumber}`, margin + 3, y + 20)
    doc.setFont('helvetica', 'normal')
    y += 26

    // Objective
    sectionHeader('Objective')
    bodyText(c.objective)
    y += 2

    // Intensity target
    sectionHeader('Intensity Target')
    bodyText(c.intensityTarget)
    y += 2

    // Warm-up
    sectionHeader('Warm-Up')
    bodyText(c.warmUp)
    y += 2

    // Main set / exercises
    sectionHeader('Main Set')
    if (c.mainSet) bodyText(c.mainSet)
    if (c.exercises && c.exercises.length > 0) {
      y += 2
      // Table header
      newPageIfNeeded(8)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text('Exercise', margin + 2, y)
      doc.text('Sets', margin + 75, y)
      doc.text('Reps', margin + 90, y)
      doc.text('Rest', margin + 110, y)
      doc.text('Notes', margin + 130, y)
      y += 4.5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      for (const ex of c.exercises) {
        newPageIfNeeded(5)
        doc.setFontSize(6.5)
        doc.text(ex.name.slice(0, 40), margin + 2, y)
        doc.text(ex.sets, margin + 75, y)
        doc.text(ex.reps, margin + 90, y)
        doc.text(ex.rest, margin + 110, y)
        if (ex.notes) doc.text(ex.notes.slice(0, 30), margin + 130, y)
        y += 4.5
      }
    }
    y += 2

    // Rest periods
    sectionHeader('Rest Periods')
    bodyText(c.restPeriods)
    y += 2

    // Cool-down
    sectionHeader('Cool-Down')
    bodyText(c.coolDown)
    y += 2

    // Coaching notes
    sectionHeader('Coaching Notes')
    bodyText(c.coachingNotes)

    // Divider at bottom
    y += 4
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y, margin + usableW, y)
  }

  return doc
}

export function exportSessionPdf(session: GeneratedSession, athlete: Athlete, plan: YearlyPlan) {
  const name = `${athlete.name.replace(/\s+/g, '_')}_${session.sessionType}_W${session.weekNumber}_S${session.sessionNumber}.pdf`
  buildDoc([session], athlete, plan).save(name)
}

export function exportWeekSessionsPdf(sessions: GeneratedSession[], athlete: Athlete, plan: YearlyPlan, weekNumber: number) {
  const name = `${athlete.name.replace(/\s+/g, '_')}_sessions_W${weekNumber}.pdf`
  buildDoc(sessions, athlete, plan).save(name)
}

export function exportAllSessionsPdf(sessions: GeneratedSession[], athlete: Athlete, plan: YearlyPlan) {
  const name = `${athlete.name.replace(/\s+/g, '_')}_all_sessions_${plan.title.replace(/\s+/g, '_')}.pdf`
  buildDoc(sessions, athlete, plan).save(name)
}
