import { useState, useMemo } from 'react'
import type { GlobalEvent, AthleteEventRef, AthleteEventType } from '../types'
import { IMPORTANCE_STARS } from '../types'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, Pencil, Trophy, Tent, ChevronDown, ChevronUp, Search, X } from 'lucide-react'

interface Props {
  refs: AthleteEventRef[]
  globalEvents: GlobalEvent[]
  onChangeRefs: (refs: AthleteEventRef[]) => void
  onSaveGlobalEvent: (event: GlobalEvent) => void
  onDeleteGlobalEvent: (id: string) => void
}

const IMPORTANCE_LABELS: Record<number, string> = {
  1: 'Local / Development',
  2: 'Development priority',
  3: 'Dev with load priority',
  4: 'Performance priority',
  5: 'Major target',
}

function eventDateStr(e: GlobalEvent) {
  return e.endDate
    ? `${format(parseISO(e.startDate), 'MMM d')} – ${format(parseISO(e.endDate), 'MMM d, yyyy')}`
    : format(parseISO(e.startDate), 'MMM d, yyyy')
}

function GlobalEventForm({ initial, onSave, onCancel }: {
  initial?: GlobalEvent
  onSave: (e: GlobalEvent) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AthleteEventType>(initial?.type ?? 'competition')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [travelBefore, setTravelBefore] = useState(initial?.travelBefore ?? 0)
  const [travelAfter, setTravelAfter] = useState(initial?.travelAfter ?? 0)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const isValid = name.trim() && startDate

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {initial ? 'Edit Event' : 'New Global Event'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Quebec Open, Japan Training Camp"
            value={name} onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Type *</label>
          <div className="flex gap-2">
            {(['competition', 'camp'] as AthleteEventType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  type === t
                    ? t === 'competition' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {t === 'competition' ? <Trophy size={13} /> : <Tent size={13} />}
                {t === 'competition' ? 'Competition' : 'Training Camp'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="City, Country"
            value={location} onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date *</label>
          <input type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            End Date {type === 'camp' ? '*' : '(optional)'}
          </label>
          <input type="date" min={startDate}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Travel days before</label>
          <input type="number" min={0} max={14}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={travelBefore || ''} onChange={e => setTravelBefore(Number(e.target.value))} placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Travel days after</label>
          <input type="number" min={0} max={14}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={travelAfter || ''} onChange={e => setTravelAfter(Number(e.target.value))} placeholder="0" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button disabled={!isValid}
          onClick={() => {
            if (!isValid) return
            onSave({
              id: initial?.id ?? crypto.randomUUID(),
              name: name.trim(), type, startDate,
              endDate: endDate || undefined,
              location: location || undefined,
              travelBefore: travelBefore || undefined,
              travelAfter: travelAfter || undefined,
              notes: notes || undefined,
            })
          }}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {initial ? 'Save Changes' : 'Create Event'}
        </button>
        <button onClick={onCancel}
          className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function EventsEditor({ refs, globalEvents, onChangeRefs, onSaveGlobalEvent, onDeleteGlobalEvent }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGlobalId, setEditingGlobalId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const refMap = useMemo(() => new Map(refs.map(r => [r.eventId, r])), [refs])

  const sorted = useMemo(() =>
    [...globalEvents]
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase())
        || e.location?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()),
    [globalEvents, search]
  )

  const assignedCount = refs.length
  const compCount = refs.filter(r => globalEvents.find(e => e.id === r.eventId)?.type === 'competition').length
  const campCount = refs.filter(r => globalEvents.find(e => e.id === r.eventId)?.type === 'camp').length

  function toggle(eventId: string, type: AthleteEventType) {
    if (refMap.has(eventId)) {
      onChangeRefs(refs.filter(r => r.eventId !== eventId))
    } else {
      const defaultImportance: 1|2|3|4|5 = type === 'camp' ? 3 : 2
      onChangeRefs([...refs, { eventId, importance: defaultImportance }])
    }
  }

  function setImportance(eventId: string, importance: 1|2|3|4|5) {
    onChangeRefs(refs.map(r => r.eventId === eventId ? { ...r, importance } : r))
  }

  function handleCreateEvent(ge: GlobalEvent) {
    onSaveGlobalEvent(ge)
    // Auto-assign the newly created event
    const defaultImportance: 1|2|3|4|5 = ge.type === 'camp' ? 3 : 2
    onChangeRefs([...refs, { eventId: ge.id, importance: defaultImportance }])
    setShowCreateForm(false)
  }

  function handleEditEvent(ge: GlobalEvent) {
    onSaveGlobalEvent(ge)
    setEditingGlobalId(null)
  }

  function handleDeleteGlobal(id: string) {
    onDeleteGlobalEvent(id)
    // Remove from refs if assigned
    onChangeRefs(refs.filter(r => r.eventId !== id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Competition & Camp Calendar</span>
          {assignedCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {compCount} comps · {campCount} camps
            </span>
          )}
          {globalEvents.length > 0 && (
            <span className="text-xs text-gray-400">{globalEvents.length} global events</span>
          )}
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          {/* Search + Create */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            {!showCreateForm && (
              <button
                onClick={() => { setShowCreateForm(true); setEditingGlobalId(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus size={13} /> New Event
              </button>
            )}
          </div>

          {/* Create form */}
          {showCreateForm && (
            <GlobalEventForm
              onSave={handleCreateEvent}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Confirm delete dialog */}
          {confirmDeleteId && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs text-red-700">Delete this event globally? It will be removed from all athletes.</p>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => handleDeleteGlobal(confirmDeleteId)}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Delete</button>
                <button onClick={() => setConfirmDeleteId(null)}
                  className="text-xs border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:border-gray-400">Cancel</button>
              </div>
            </div>
          )}

          {/* No events state */}
          {globalEvents.length === 0 && !showCreateForm && (
            <p className="text-xs text-gray-400 text-center py-4">
              No events yet. Create the first competition or camp — it will be reusable across all athletes.
            </p>
          )}

          {/* Event list */}
          {sorted.map(ge => {
            const ref = refMap.get(ge.id)
            const isAssigned = !!ref
            const isComp = ge.type === 'competition'

            if (editingGlobalId === ge.id) {
              return (
                <div key={ge.id} className="mb-2">
                  <GlobalEventForm
                    initial={ge}
                    onSave={handleEditEvent}
                    onCancel={() => setEditingGlobalId(null)}
                  />
                </div>
              )
            }

            return (
              <div key={ge.id}
                className={`rounded-lg border transition-colors ${
                  isAssigned
                    ? 'border-blue-200 bg-blue-50/60'
                    : 'border-transparent hover:bg-gray-50'
                }`}>
                {/* Main row */}
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggle(ge.id, ge.type)}
                    className="w-4 h-4 accent-blue-600 rounded shrink-0 cursor-pointer"
                  />
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isComp ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {isComp
                      ? <Trophy size={12} className="text-red-500" />
                      : <Tent size={12} className="text-blue-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{ge.name}</span>
                      {ge.location && <span className="text-xs text-gray-400">{ge.location}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {eventDateStr(ge)}
                      {(ge.travelBefore || ge.travelAfter) && (
                        <span className="ml-2 text-slate-400">
                          {[
                            ge.travelBefore ? `${ge.travelBefore}d before` : null,
                            ge.travelAfter ? `${ge.travelAfter}d after` : null,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingGlobalId(ge.id); setShowCreateForm(false) }}
                      title="Edit event (global)"
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(ge.id)}
                      title="Delete event globally"
                      className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Importance selector — only for assigned events */}
                {isAssigned && ref && (
                  <div className="px-3 pb-2.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">
                      {isComp ? 'Importance:' : 'Priority:'}
                    </span>
                    <div className="flex gap-1">
                      {([1,2,3,4,5] as const).map(i => (
                        <button
                          key={i}
                          onClick={() => setImportance(ge.id, i)}
                          title={IMPORTANCE_LABELS[i]}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            ref.importance === i
                              ? isComp ? 'bg-red-500 text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {IMPORTANCE_STARS[i - 1]}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-1">{IMPORTANCE_LABELS[ref.importance]}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
