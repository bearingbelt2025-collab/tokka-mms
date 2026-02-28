'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/page-header';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  CalendarClock,
  Plus,
  CheckCircle,
  AlertCircle,
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PM_FREQUENCIES } from '@/lib/constants';

interface PMSchedule {
  id: string;
  machine_id: string;
  task_name: string;
  frequency: string;
  last_done_at: string | null;
  next_due_at: string;
  status: string;
  notes: string | null;
  machines: { name: string } | null;
}

export default function PMSchedulePage() {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const supabase = createClient();
    const [pmRes, machRes] = await Promise.all([
      supabase
        .from('pm_schedules')
        .select('*, machines(name)')
        .order('next_due_at'),
      supabase.from('machines').select('id, name').order('name'),
    ]);
    setSchedules(pmRes.data || []);
    setMachines(machRes.data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const supabase = createClient();
    await supabase.from('pm_schedules').insert({
      machine_id: fd.get('machine_id') as string,
      task_name: fd.get('task_name') as string,
      frequency: fd.get('frequency') as string,
      next_due_at: fd.get('next_due_at') as string,
      notes: fd.get('notes') as string || null,
    });
    setDialogOpen(false);
    fetchAll();
  };

  const handleMarkDone = async (schedule: PMSchedule) => {
    const supabase = createClient();
    const now = new Date();
    let nextDue = new Date(now);
    switch (schedule.frequency) {
      case 'daily': nextDue.setDate(now.getDate() + 1); break;
      case 'weekly': nextDue.setDate(now.getDate() + 7); break;
      case 'monthly': nextDue.setMonth(now.getMonth() + 1); break;
      case 'quarterly': nextDue.setMonth(now.getMonth() + 3); break;
      case 'semi_annual': nextDue.setMonth(now.getMonth() + 6); break;
      case 'annual': nextDue.setFullYear(now.getFullYear() + 1); break;
    }
    await supabase.from('pm_schedules').update({
      last_done_at: now.toISOString(),
      next_due_at: nextDue.toISOString(),
      status: 'upcoming',
    }).eq('id', schedule.id);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('pm_schedules').delete().eq('id', id);
    fetchAll();
  };

  if (loading) return <LoadingSkeleton />;

  const overdue = schedules.filter(s => s.status === 'overdue');
  const upcoming = schedules.filter(s => s.status === 'upcoming');

  return (
    <div className="space-y-4">
      <PageHeader
        title="PM Schedule"
        description="Preventive maintenance schedules"
        action={
          isAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add PM Schedule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Machine *</Label>
                    <Select name="machine_id" required>
                      <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                      <SelectContent>
                        {machines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Task Name *</Label>
                    <Input name="task_name" placeholder="e.g., Oil Change" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Frequency *</Label>
                      <Select name="frequency" required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {PM_FREQUENCIES.map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Next Due *</Label>
                      <Input name="next_due_at" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input name="notes" placeholder="Optional notes" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1">Add Schedule</Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-sm">{overdue.length} Overdue PM Tasks</span>
          </div>
          <div className="space-y-1">
            {overdue.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{s.machines?.name} — {s.task_name}</span>
                <span className="text-red-600 text-xs">
                  Due: {new Date(s.next_due_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="hidden md:table-cell">Frequency</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium text-sm">{schedule.machines?.name}</TableCell>
                <TableCell className="text-sm">{schedule.task_name}</TableCell>
                <TableCell className="hidden md:table-cell text-sm capitalize">
                  {schedule.frequency.replace('_', ' ')}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(schedule.next_due_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={schedule.status === 'overdue' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {schedule.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-green-600"
                      onClick={() => handleMarkDone(schedule)}
                    >
                      <CheckCircle className="h-3 w-3" /> Done
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
