import { cn } from '@/lib/utils';

const woStatusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  resolved: { label: 'Resolved', className: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Closed', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

interface WoStatusBadgeProps {
  status: string;
}

export function WoStatusBadge({ status }: WoStatusBadgeProps) {
  const config = woStatusConfig[status] || { label: status, className: 'bg-gray-50 text-gray-600' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}
