'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/page-header';
import { WoStatusBadge } from '@/components/wo-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  ClipboardList,
  Plus,
  Search,
  ChevronDown,
  User,
  Clock,
  Wrench,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WO_STATUSES, PRIORITIES, ISSUE_TYPES } from '@/lib/constants';
import { createWorkOrder, updateWorkOrderStatus } from '@/lib/supabase/mutations';

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  priority: string;
  status: string;
  machine_id: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  machines: { name: string } | null;
  profiles: { full_name: string } | null;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile, user } = useAuth();
  const supabase = createClient();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('work_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    const supabase = createClient();
    const [woRes, machRes, techRes] = await Promise.all([
      supabase
        .from('work_orders')
        .select('*, machines(name), profiles(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('machines').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'technician'),
    ]);
    setWorkOrders(woRes.data || []);
    setMachines(machRes.data || []);
    setTechnicians(techRes.data || []);
    setLoading(false);
  };

  const filtered = workOrders.filter((wo) => {
    const matchSearch =
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.machines?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await createWorkOrder({
      machine_id: fd.get('machine_id') as string,
      title: fd.get('title') as string,
      description: fd.get('description') as string || null,
      issue_type: fd.get('issue_type') as string,
      priority: fd.get('priority') as string,
      assigned_to: fd.get('assigned_to') as string || null,
      created_by: user!.id,
    });
    setDialogOpen(false);
    fetchAll();
  };

  const handleStatusUpdate = async (woId: string, newStatus: string) => {
    await updateWorkOrderStatus(woId, newStatus);
    fetchAll();
  };

  if (loading) return <LoadingSkeleton />;

  const statCounts = {
    open: workOrders.filter(w => w.status === 'open').length,
    in_progress: workOrders.filter(w => w.status === 'in_progress').length,
    resolved: workOrders.filter(w => w.status === 'resolved').length,
    closed: workOrders.filter(w => w.status === 'closed').length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Work Orders"
        description="Create and track maintenance requests"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Work Order</DialogTitle>
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
                  <Label>Issue Type *</Label>
                  <Select name="issue_type" required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input name="title" placeholder="Brief description" required />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea name="description" rows={2} placeholder="More details..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Priority *</Label>
                    <Select name="priority" defaultValue="medium" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdmin && (
                    <div className="space-y-1">
                      <Label>Assign To</Label>
                      <Select name="assigned_to">
                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          {technicians.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">Create Work Order</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(statCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-2 rounded-lg border text-center transition-colors ${
              statusFilter === status ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-lg font-bold">{count}</p>
            <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {WO_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Work Orders Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No work orders found"
          description="Create your first work order"
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Machine</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Assigned</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{wo.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wo.issue_type.replace('_', ' ')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{wo.machines?.name}</TableCell>
                  <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                  <TableCell><WoStatusBadge status={wo.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {wo.profiles?.full_name || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(wo.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {WO_STATUSES.map(s => (
                          <DropdownMenuItem
                            key={s.value}
                            onClick={() => handleStatusUpdate(wo.id, s.value)}
                            disabled={wo.status === s.value}
                          >
                            Set: {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
