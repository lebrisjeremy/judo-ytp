import { useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import type { RuleResult } from '../lib/rules'

interface Props {
  results: RuleResult[]
}

export function RecommendationBanner({ results }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = results.filter(r => !dismissed.has(r.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {visible.map(r => (
        <div key={r.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
            r.level === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
          {r.level === 'warning'
            ? <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            : <Info size={15} className="shrink-0 mt-0.5" />
          }
          <span className="flex-1">{r.message}</span>
          <button
            onClick={() => setDismissed(prev => new Set([...prev, r.id]))}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
