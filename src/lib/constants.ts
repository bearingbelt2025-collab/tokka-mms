export const MACHINE_STATUSES = [
  { value: 'running', label: 'Running' },
  { value: 'maintenance_due', label: 'Maintenance Due' },
  { value: 'breakdown', label: 'Breakdown' },
  { value: 'offline', label: 'Offline' },
];

export const MACHINE_LOCATIONS = [
  'Wire Drawing Line 1',
  'Wire Drawing Line 2',
  'Nail Making Section',
  'Packaging Area',
  'Maintenance Bay',
  'Utility Room',
];

export const WO_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const ISSUE_TYPES = [
  'mechanical_failure',
  'electrical_issue',
  'lubrication',
  'calibration',
  'part_replacement',
  'inspection',
  'cleaning',
  'other',
];

export const PM_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
];

export const DOWNTIME_CAUSES = [
  'Mechanical Failure',
  'Electrical Fault',
  'Power Outage',
  'Raw Material Issue',
  'Operator Error',
  'Scheduled Maintenance',
  'Other',
];

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-700 bg-green-50 border-green-200',
  medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-red-700 bg-red-50 border-red-200',
};
