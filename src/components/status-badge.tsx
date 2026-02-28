import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  running: {
    label: 'Running',
    className: 'bg-green-50 text-green-700 border-green-200',
    dotColor: 'bg-green-500',
  },
  maintenance_due: {
    label: 'Maint. Due',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  breakdown: {
    label: 'Breakdown',
    className: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
  },
  offline: {
    label: 'Offline',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  },
};

interface StatusBadgeProps {
  status: string;
  size?: 'default' | 'dot';
}

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-50 text-gray-600', dotColor: 'bg-gray-400' };

  if (size === 'dot') {
    return (
      <div className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', config.dotColor)} />
    );
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}
