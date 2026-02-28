import { StatusBadge } from './status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, Tag, Wrench } from 'lucide-react';

interface MachineCardProps {
  machine: {
    id: string;
    name: string;
    model: string | null;
    serial_number: string | null;
    location: string;
    status: string;
    installed_at: string | null;
    last_maintained_at: string | null;
  };
  actions?: React.ReactNode;
}

export function MachineCard({ machine, actions }: MachineCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{machine.name}</h3>
              {machine.model && <p className="text-xs text-muted-foreground">{machine.model}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={machine.status} />
            {actions}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {machine.location}
          </div>
          {machine.serial_number && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              SN: {machine.serial_number}
            </div>
          )}
          {machine.installed_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Installed: {new Date(machine.installed_at).toLocaleDateString()}
            </div>
          )}
          {machine.last_maintained_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              Last maintained: {new Date(machine.last_maintained_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
