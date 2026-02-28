'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  Wrench,
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MACHINE_STATUSES, MACHINE_LOCATIONS } from '@/lib/constants';
import { addMachine, updateMachineStatus } from '@/lib/supabase/mutations';

interface Machine {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string;
  status: string;
  notes: string | null;
  installed_at: string | null;
  last_maintained_at: string | null;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const { profile } = useAuth();
  const supabase = createClient();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchMachines();
    const channel = supabase
      .channel('machines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchMachines)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMachines = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('machines').select('*').order('name');
    setMachines(data || []);
    setLoading(false);
  };

  const filtered = machines.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get('name') as string,
      model: fd.get('model') as string || null,
      serial_number: fd.get('serial_number') as string || null,
      location: fd.get('location') as string,
      status: fd.get('status') as string,
      notes: fd.get('notes') as string || null,
      installed_at: fd.get('installed_at') as string || null,
    };

    if (editMachine) {
      const supabase = createClient();
      await supabase.from('machines').update(payload).eq('id', editMachine.id);
    } else {
      await addMachine(payload);
    }
    setDialogOpen(false);
    setEditMachine(null);
    fetchMachines();
  };

  const handleStatusChange = async (machineId: string, newStatus: string) => {
    await updateMachineStatus(machineId, newStatus);
    fetchMachines();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('machines').delete().eq('id', id);
    fetchMachines();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Machine Registry"
        description="All machines with real-time status"
        action={
          isAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditMachine(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Machine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Machine Name *</Label>
                    <Input id="name" name="name" defaultValue={editMachine?.name} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" name="model" defaultValue={editMachine?.model || ''} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="serial_number">Serial No.</Label>
                      <Input id="serial_number" name="serial_number" defaultValue={editMachine?.serial_number || ''} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location *</Label>
                    <Select name="location" defaultValue={editMachine?.location || MACHINE_LOCATIONS[0]}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MACHINE_LOCATIONS.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue={editMachine?.status || 'running'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MACHINE_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="installed_at">Installation Date</Label>
                    <Input id="installed_at" name="installed_at" type="date" defaultValue={editMachine?.installed_at?.split('T')[0] || ''} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" rows={2} defaultValue={editMachine?.notes || ''} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1">{editMachine ? 'Save Changes' : 'Add Machine'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditMachine(null); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search machines..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {MACHINE_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-8 w-8" />}
          title="No machines found"
          description={search ? 'Try adjusting your search' : 'Add your first machine to get started'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((machine) => (
            <Card key={machine.id} className="relative">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{machine.name}</h3>
                    {machine.model && (
                      <p className="text-xs text-muted-foreground">{machine.model}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <StatusBadge status={machine.status} />
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditMachine(machine); setDialogOpen(true); }}>
                            Edit
                          </DropdownMenuItem>
                          {MACHINE_STATUSES.map(s => (
                            <DropdownMenuItem
                              key={s.value}
                              onClick={() => handleStatusChange(machine.id, s.value)}
                              disabled={machine.status === s.value}
                            >
                              Set: {s.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(machine.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
