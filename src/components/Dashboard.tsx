import { useState, useRef } from 'react'
import { usePlanStore } from '../store/planStore'
import type { Athlete } from '../types'
import { EventsEditor } from './EventsEditor'
import { Plus, Trash2, ChevronRight, User, Calendar, Wand2, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { exportAthlete, validateImport, resolveImport } from '../lib/exportImport'
import type { AthleteExport } from '../lib/exportImport'

interface Props {
  onOpenPlan: (planId: string) => void
}

const TRAINING_AGE_PROFILES = [
  { max: 1, label: 'Beginner (< 1 yr S&C)', cycles: 'Reathletisation → Force Endurance → Pyramid → Power' },
  { max: 3, label: 'Intermediate (1–3 yrs S&C)', cycles: 'Adds Hypertrophy & Excentric phases' },
  { max: 99, label: 'Advanced (4+ yrs S&C)', cycles: 'Full periodization: Force Endurance → Hypertrophy → Pyramid → Excentric → Force MAX → Power' },
]

function AthleteForm({ onSave, onCancel, initial }: {
  onSave: (a: Athlete) => void
  onCancel: () => void
  initial?: Athlete
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [weightClass, setWeightClass] = useState(initial?.weightClass ?? '')
  const [team, setTeam] = useState(initial?.team ?? '')
  const [club, setClub] = useState(initial?.club ?? '')
  const [level, setLevel] = useState<NonNullable<Athlete['level']>>(initial?.level ?? 'junior')
  const [trainingAge, setTrainingAge] = useState(initial?.trainingAge ?? 2)
  const [showWeightCycles, setShowWeightCycles] = useState(initial?.showWeightCycles ?? false)
  const [showCardioCycles, setShowCardioCycles] = useState(initial?.showCardioCycles ?? false)

  const ageProfile = TRAINING_AGE_PROFILES.find(p => trainingAge <= p.max) ?? TRAINING_AGE_PROFILES[2]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
      <h3 className="font-semibold text-gray-800">{initial ? 'Edit Athlete' : 'New Athlete'}</h3>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Name *</label>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={name} onChange={e => setName(e.target.value)} placeholder="Athlete name" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Weight Class *</label>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={weightClass} onChange={e => setWeightClass(e.target.value)} placeholder="-73kg" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Team</label>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={team} onChange={e => setTeam(e.target.value)} placeholder="Team BC" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Club</label>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={club} onChange={e => setClub(e.target.value)} placeholder="Judo BC" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Competition Level</label>
          <select className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={level} onChange={e => setLevel(e.target.value as NonNullable<Athlete['level']>)}>
            <option value="cadet">Cadet</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
            <option value="provincial1">Provincial 1</option>
            <option value="provincial2">Provincial 2</option>
            <option value="elite">Elite</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">S&C Training Age (years)</label>
          <input type="number" min={0} max={20}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={trainingAge} onChange={e => setTrainingAge(Number(e.target.value))} />
        </div>
      </div>

      {/* S&C profile indicator */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
        <span className="font-semibold text-gray-800">{ageProfile.label}</span>
        <span className="text-gray-400 mx-1">·</span>
        {ageProfile.cycles}
      </div>

      {/* Cycle display toggles */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Show on Year Grid</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showWeightCycles} onChange={e => setShowWeightCycles(e.target.checked)}
              className="w-4 h-4 accent-green-600 rounded" />
            <div>
              <span className="text-sm font-medium text-gray-700">Weight Cycles</span>
              <p className="text-xs text-gray-400">S&C periodization row in Year Grid</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCardioCycles} onChange={e => setShowCardioCycles(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded" />
            <div>
              <span className="text-sm font-medium text-gray-700">Cardio Cycles</span>
              <p className="text-xs text-gray-400">Conditioning periodization row in Year Grid</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => {
          if (!name || !weightClass) return
          onSave({
            ...(initial ?? {}),
            id: initial?.id ?? crypto.randomUUID(),
            name, weightClass,
            team: team || undefined,
            club: club || undefined,
            level,
            trainingAge,
            showWeightCycles,
            showCardioCycles,
          })
        }} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Save Athlete
        </button>
        <button onClick={onCancel} className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function NewPlanForm({ hasEvents, onSave, onCancel }: {
  hasEvents: boolean
  onSave: (title: string, startDate: string, autoGenerate: boolean) => void
  onCancel: () => void
}) {
  const currentYear = new Date().getFullYear()
  const [title, setTitle] = useState(`${currentYear}-${currentYear + 1} Season`)
  const [startDate, setStartDate] = useState(`${currentYear}-09-01`)
  const [autoGenerate, setAutoGenerate] = useState(hasEvents)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Plan Title</label>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Start Date (Monday)</label>
          <input type="date" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
      </div>

      {hasEvents && (
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-dashed transition-colors hover:bg-white
          border-blue-300 bg-blue-50">
          <input type="checkbox" checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded" />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
              <Wand2 size={14} /> Auto-generate from competition calendar
            </div>
            <p className="text-xs text-blue-600 mt-0.5">
              Phases, volume, and intensity will be set automatically based on your events.
            </p>
          </div>
        </label>
      )}

      {!hasEvents && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Add competitions and camps to this athlete first to enable auto-generation.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onSave(title, startDate, autoGenerate && hasEvents)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {autoGenerate && hasEvents ? <><Wand2 size={14} /> Generate Plan</> : <>Create Plan</>}
        </button>
        <button onClick={onCancel} className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function Dashboard({ onOpenPlan }: Props) {
  const { athletes, plans, globalEvents, saveAthlete, deleteAthlete, createPlan, deletePlan, saveGlobalEvent, deleteGlobalEvent, importAthlete } = usePlanStore()
  const [showAthleteForm, setShowAthleteForm] = useState(false)
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null)
  const [newPlanFor, setNewPlanFor] = useState<string | null>(null)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'athlete' | 'plan'; id: string } | null>(null)
  const [importModal, setImportModal] = useState<{ data: AthleteExport; duplicate: Athlete | undefined } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleAthleteExpand(id: string) {
    setExpandedAthleteId(prev => prev === id ? null : id)
  }

  function handleSaveAthlete(a: Athlete) {
    saveAthlete(a)
    setShowAthleteForm(false)
    setEditingAthleteId(null)
    if (!athletes.find(x => x.id === a.id)) setExpandedAthleteId(a.id)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const result = validateImport(parsed)
        if (!result.ok) { setImportError(result.error); return }
        const duplicate = athletes.find(a => a.id === result.data.athlete.id)
        setImportModal({ data: result.data, duplicate })
      } catch {
        setImportError('Could not parse file. Make sure it is a valid JSON export.')
      }
    }
    reader.readAsText(file)
  }

  function handleConfirmImport(mode: 'replace' | 'copy') {
    if (!importModal) return
    const { athlete, plans: newPlans, newGlobalEvents } = resolveImport(
      importModal.data, globalEvents, mode
    )
    importAthlete(athlete, newPlans, newGlobalEvents)
    setImportModal(null)
    setExpandedAthleteId(athlete.id)
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judo YTP</h1>
            <p className="text-gray-500 text-sm mt-1">Yearly Training Plan Builder</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm border border-gray-200"
            >
              <Upload size={16} /> Import
            </button>
            <button
              onClick={() => { setShowAthleteForm(true); setEditingAthleteId(null) }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus size={16} /> New Athlete
            </button>
          </div>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
              <h3 className="font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-4">
                {confirmDelete.type === 'athlete'
                  ? 'Delete this athlete and all their plans? This cannot be undone.'
                  : 'Delete this plan? This cannot be undone.'}
              </p>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (confirmDelete.type === 'athlete') deleteAthlete(confirmDelete.id)
                  else deletePlan(confirmDelete.id)
                  setConfirmDelete(null)
                }} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  Delete
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import error */}
        {importError && (
          <div className="mb-4 flex items-start justify-between gap-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Import modal */}
        {importModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
              {importModal.duplicate ? (
                <>
                  <h3 className="font-bold text-gray-900">Athlete Already Exists</h3>
                  <p className="text-sm text-gray-600">
                    <strong>{importModal.data.athlete.name}</strong> ({importModal.data.athlete.weightClass}) is already in your roster. What would you like to do?
                  </p>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-0.5">
                    <div>{importModal.data.plans.length} plan{importModal.data.plans.length !== 1 ? 's' : ''} · {importModal.data.globalEvents.length} event{importModal.data.globalEvents.length !== 1 ? 's' : ''}</div>
                    <div>Exported {importModal.data.exportDate}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleConfirmImport('replace')}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                      Replace Existing
                    </button>
                    <button onClick={() => handleConfirmImport('copy')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                      Import as Copy
                    </button>
                    <button onClick={() => setImportModal(null)}
                      className="text-sm text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-gray-900">Import Athlete</h3>
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1">
                    <p className="font-semibold text-gray-800">{importModal.data.athlete.name} <span className="font-mono text-xs text-gray-500">{importModal.data.athlete.weightClass}</span></p>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>{importModal.data.plans.length} plan{importModal.data.plans.length !== 1 ? 's' : ''} · {importModal.data.plans.reduce((s, p) => s + p.weeks.length, 0)} weeks total</div>
                      <div>{importModal.data.globalEvents.length} event{importModal.data.globalEvents.length !== 1 ? 's' : ''} (competitions &amp; camps)</div>
                      {importModal.data.plans[0] && (
                        <div>Starts {importModal.data.plans[0].startDate}</div>
                      )}
                      <div className="text-gray-400">Exported {importModal.data.exportDate}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirmImport('replace')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex-1">
                      Import
                    </button>
                    <button onClick={() => setImportModal(null)}
                      className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* New athlete form */}
        {showAthleteForm && (
          <div className="mb-6">
            <AthleteForm
              onSave={handleSaveAthlete}
              onCancel={() => setShowAthleteForm(false)}
            />
          </div>
        )}

        {athletes.length === 0 && !showAthleteForm && (
          <div className="text-center py-20 text-gray-400">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No athletes yet</p>
            <p className="text-sm mt-1">Click "New Athlete" to get started</p>
          </div>
        )}

        {/* Athletes list */}
        <div className="space-y-4">
          {athletes.map(athlete => {
            const athletePlans = plans.filter(p => p.athleteId === athlete.id)
            const refs = athlete.eventRefs ?? []
            const compCount = refs.filter(r => globalEvents.find(e => e.id === r.eventId)?.type === 'competition').length
            const campCount = refs.filter(r => globalEvents.find(e => e.id === r.eventId)?.type === 'camp').length
            const isEditing = editingAthleteId === athlete.id
            const isExpanded = expandedAthleteId === athlete.id

            return (
              <div key={athlete.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Edit form */}
                {isEditing ? (
                  <div className="p-4">
                    <AthleteForm
                      initial={athlete}
                      onSave={handleSaveAthlete}
                      onCancel={() => setEditingAthleteId(null)}
                    />
                  </div>
                ) : (
                  <>
                    {/* Athlete header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <button
                        onClick={() => toggleAthleteExpand(athlete.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <User size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{athlete.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{athlete.weightClass}</span>
                            {athlete.level && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{athlete.level}</span>
                            )}
                            {refs.length > 0 && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                {compCount} comps · {campCount} camps
                              </span>
                            )}
                          </div>
                          {(athlete.team || athlete.club) && (
                            <p className="text-xs text-gray-500 mt-0.5">{[athlete.team, athlete.club].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                        <div className="ml-2">
                          {isExpanded
                            ? <ChevronUp size={15} className="text-gray-400" />
                            : <ChevronDown size={15} className="text-gray-400" />
                          }
                        </div>
                      </button>

                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => exportAthlete(athlete, plans, globalEvents)}
                          title="Export athlete data"
                          className="text-gray-400 hover:text-green-600 p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => { setEditingAthleteId(athlete.id); setExpandedAthleteId(null) }}
                          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'athlete', id: athlete.id })}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div className="px-5 py-4 space-y-4 border-b border-gray-100">
                        {/* Events editor */}
                        <EventsEditor
                          refs={refs}
                          globalEvents={globalEvents}
                          onChangeRefs={newRefs => saveAthlete({ ...athlete, eventRefs: newRefs })}
                          onSaveGlobalEvent={saveGlobalEvent}
                          onDeleteGlobalEvent={deleteGlobalEvent}
                        />
                      </div>
                    )}

                    {/* Plans list */}
                    <div className="px-5 py-3 space-y-1">
                      {athletePlans.map(plan => (
                        <div key={plan.id} className="flex items-center justify-between group">
                          <button
                            onClick={() => onOpenPlan(plan.id)}
                            className="flex items-center gap-3 flex-1 text-left hover:bg-gray-50 rounded-lg px-3 py-2.5 transition-colors"
                          >
                            <Calendar size={15} className="text-gray-400 shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-gray-800">{plan.title}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {format(new Date(plan.startDate), 'MMM d, yyyy')} · {plan.weeks.length} weeks
                              </span>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'plan', id: plan.id })}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {newPlanFor === athlete.id ? (
                        <NewPlanForm
                          hasEvents={refs.length > 0}
                          onSave={(title, startDate, autoGenerate) => {
                            const id = createPlan(athlete.id, title, startDate, autoGenerate)
                            setNewPlanFor(null)
                            onOpenPlan(id)
                          }}
                          onCancel={() => setNewPlanFor(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setNewPlanFor(athlete.id)}
                          className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors w-full"
                        >
                          <Plus size={14} /> New Training Plan
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
