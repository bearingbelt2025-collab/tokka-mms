'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/page-header';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  StopCircle,
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
import { Textarea } from '@/components/ui/textarea';
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
import { DOWNTIME_CAUSES } from '@/lib/constants';

interface DowntimeLog {
  id: string;
  machine_id: string;
  cause: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  machines: { name: string } | null;
}

export default function DowntimePage() {
  const [logs, setLogs] = useState<DowntimeLog[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { profile } = useAuth();

  // Live clock for active downtime
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAll();
    const supabase = createClient();
    const channel = supabase
      .channel('downtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime_logs' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    const supabase = createClient();
    const [logRes, machRes] = await Promise.all([
      supabase
        .from('downtime_logs')
        .select('*, machines(name)')
        .order('start_time', { ascending: false }),
      supabase.from('machines').select('id, name').order('name'),
    ]);
    setLogs(logRes.data || []);
    setMachines(machRes.data || []);
    setLoading(false);
  };

  const handleLogDowntime = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const supabase = createClient();
    await supabase.from('downtime_logs').insert({
      machine_id: fd.get('machine_id') as string,
      cause: fd.get('cause') as string,
      description: fd.get('description') as string || null,
      start_time: new Date().toISOString(),
    });
    // Also update machine status to breakdown
    const machineId = fd.get('machine_id') as string;
    await supabase.from('machines').update({ status: 'breakdown' }).eq('id', machineId);
    setDialogOpen(false);
    fetchAll();
  };

  const handleEndDowntime = async (log: DowntimeLog) => {
    const supabase = createClient();
    const end = new Date();
    const start = new Date(log.start_time);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    await supabase.from('downtime_logs').update({
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
    }).eq('id', log.id);
    // Update machine back to running
    await supabase.from('machines').update({ status: 'running' }).eq('id', log.machine_id);
    fetchAll();
  };

  const formatDuration = (log: DowntimeLog) => {
    if (log.duration_minutes) {
      const h = Math.floor(log.duration_minutes / 60);
      const m = log.duration_minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    if (!log.end_time) {
      const diffMin = Math.round((now.getTime() - new Date(log.start_time).getTime()) / 60000);
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return `${h > 0 ? h + 'h ' : ''}${m}m (live)`;
    }
    return '—';
  };

  if (loading) return <LoadingSkeleton />;

  const activeDowntime = logs.filter(l => !l.end_time);
  const totalHours = logs
    .filter(l => l.duration_minutes)
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Downtime Tracker"
        description="Log and monitor machine downtime"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1.5">
                <Plus className="h-4 w-4" /> Log Downtime
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Machine Downtime</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogDowntime} className="space-y-3">
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
                  <Label>Cause *</Label>
                  <Select name="cause" required>
                    <SelectTrigger><SelectValue placeholder="Select cause" /></SelectTrigger>
                    <SelectContent>
                      {DOWNTIME_CAUSES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea name="description" rows={2} placeholder="What happened?" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="destructive" className="flex-1">Start Downtime Log</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Active Downtime Alert */}
      {activeDowntime.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-sm">{activeDowntime.length} Machine(s) Currently Down</span>
          </div>
          <div className="space-y-2">
            {activeDowntime.map(log => (
              <div key={log.id} className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-red-800">{log.machines?.name}</span>
                  <span className="text-xs text-red-600 ml-2">{log.cause}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">{formatDuration(log)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-red-200"
                    onClick={() => handleEndDowntime(log)}
                  >
                    <StopCircle className="h-3 w-3" /> End
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{activeDowntime.length}</p>
            <p className="text-xs text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Incidents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{Math.round(totalHours * 10) / 10}h</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Downtime Table */}
      {logs.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="No downtime logged"
          description="Log downtime when a machine goes down"
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead className="hidden md:table-cell">Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-sm">{log.machines?.name}</TableCell>
                  <TableCell className="text-sm">{log.cause}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(log.start_time).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(log)}</TableCell>
                  <TableCell>
                    <Badge variant={log.end_time ? 'secondary' : 'destructive'} className="text-xs">
                      {log.end_time ? 'Resolved' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!log.end_time && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-green-600"
                        onClick={() => handleEndDowntime(log)}
                      >
                        <CheckCircle className="h-3 w-3" /> Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
