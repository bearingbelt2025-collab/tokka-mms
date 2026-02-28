import { cn } from '@/lib/utils'
import { Cog } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { Machine } from '@/types/database'

interface MachineCardProps {
  machine: Machine
  onClick?: () => void
  openWoCount?: number
  compact?: boolean
}

const STATUS_BORDER: Record<Machine['status'], string> = {
  running: 'border-emerald-500/40 hover:border-emerald-500/70',
  maintenance_due: 'border-amber-500/40 hover:border-amber-500/70',
  breakdown: 'border-red-500/40 hover:border-red-500/70',
}

const STATUS_DOT: Record<Machine['status'], string> = {
  running: 'bg-emerald-500',
  maintenance_due: 'bg-amber-500',
  breakdown: 'bg-red-500',
}

export function MachineCard({ machine, onClick, openWoCount, compact = false }: MachineCardProps) {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'bg-card border rounded-md p-3 cursor-pointer transition-all duration-150',
          STATUS_BORDER[machine.status]
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold font-mono-display truncate leading-tight">{machine.name}</p>
            <p className="text-xs text-muted-foreground truncate">{machine.location}</p>
          </div>
          <span className={cn('h-2 w-2 rounded-full shrink-0 mt-1', STATUS_DOT[machine.status])} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {machine.status.replace('_', ' ')}
        </p>
      </div>
    )
  }

  const specs = machine.specs as Record<string, string> | null

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border rounded-md p-4 cursor-pointer transition-all duration-150 flex flex-col gap-3',
        STATUS_BORDER[machine.status]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {machine.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={machine.photo_url}
              alt={machine.name}
              className="h-10 w-10 rounded-md object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <Cog className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold font-mono-display truncate">{machine.name}</p>
            <p className="text-xs text-muted-foreground truncate">{machine.location}</p>
          </div>
        </div>
        <StatusBadge status={machine.status} size="sm" className="shrink-0" />
      </div>

      {/* Specs */}
      {specs && Object.keys(specs).length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(specs).slice(0, 4).map(([k, v]) => (
            <div key={k} className="bg-secondary/50 rounded-sm px-2 py-1">
              <p className="text-xs text-muted-foreground capitalize">{k.replace('_', ' ')}</p>
              <p className="text-xs font-medium truncate">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <span>Last service: {machine.last_service_date ? new Date(machine.last_service_date).toLocaleDateString() : '—'}</span>
        {openWoCount !== undefined && openWoCount > 0 && (
          <span className="text-amber-400 font-medium">{openWoCount} open WO{openWoCount > 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
