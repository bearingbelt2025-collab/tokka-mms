'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { KpiCard } from '@/components/kpi-card';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import {
  Wrench,
  ClipboardList,
  CalendarClock,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MACHINE_STATUSES, PRIORITY_COLORS } from '@/lib/constants';

interface DashboardStats {
  totalMachines: number;
  runningMachines: number;
  maintenanceDueMachines: number;
  breakdownMachines: number;
  openWorkOrders: number;
  inProgressWorkOrders: number;
  overduepmSchedules: number;
  totalDowntimeHours: number;
  activeDowntime: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentWorkOrders, setRecentWorkOrders] = useState<any[]>([]);
  const [machineStatusList, setMachineStatusList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime_logs' }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();

    const [machinesRes, workOrdersRes, pmRes, downtimeRes] = await Promise.all([
      supabase.from('machines').select('id, name, status, location'),
      supabase.from('work_orders').select('id, title, status, priority, created_at, machines(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('pm_schedules').select('id, status'),
      supabase.from('downtime_logs').select('id, duration_minutes, end_time'),
    ]);

    const machines = machinesRes.data || [];
    const workOrders = workOrdersRes.data || [];
    const pmSchedules = pmRes.data || [];
    const downtimeLogs = downtimeRes.data || [];

    const completedDowntime = downtimeLogs.filter(d => d.end_time && d.duration_minutes);
    const totalDowntimeHours = completedDowntime.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / 60;
    const activeDowntime = downtimeLogs.filter(d => !d.end_time).length;

    setStats({
      totalMachines: machines.length,
      runningMachines: machines.filter(m => m.status === 'running').length,
      maintenanceDueMachines: machines.filter(m => m.status === 'maintenance_due').length,
      breakdownMachines: machines.filter(m => m.status === 'breakdown').length,
      openWorkOrders: workOrders.filter(w => w.status === 'open').length,
      inProgressWorkOrders: workOrders.filter(w => w.status === 'in_progress').length,
      overduepmSchedules: pmSchedules.filter(p => p.status === 'overdue').length,
      totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
      activeDowntime,
    });

    setRecentWorkOrders(workOrders);
    setMachineStatusList(machines);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile?.full_name || 'User'}. Here's your plant overview.`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Machines"
          value={stats?.totalMachines ?? 0}
          icon={<Wrench className="h-4 w-4" />}
          description={`${stats?.runningMachines} running`}
        />
        <KpiCard
          title="Open Work Orders"
          value={(stats?.openWorkOrders ?? 0) + (stats?.inProgressWorkOrders ?? 0)}
          icon={<ClipboardList className="h-4 w-4" />}
          description={`${stats?.inProgressWorkOrders} in progress`}
          variant={((stats?.openWorkOrders ?? 0) + (stats?.inProgressWorkOrders ?? 0)) > 5 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Overdue PM"
          value={stats?.overduepmSchedules ?? 0}
          icon={<CalendarClock className="h-4 w-4" />}
          description="schedules overdue"
          variant={(stats?.overduepmSchedules ?? 0) > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          title="Downtime Hours"
          value={stats?.totalDowntimeHours ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          description={`${stats?.activeDowntime} active now`}
          variant={(stats?.activeDowntime ?? 0) > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Machine Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {machineStatusList.map((machine) => (
                <div
                  key={machine.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50"
                >
                  <StatusBadge status={machine.status} size="dot" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{machine.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{machine.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWorkOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No work orders yet</p>
              ) : (
                recentWorkOrders.map((wo) => (
                  <div key={wo.id} className="flex items-start gap-3 p-2 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">{(wo.machines as any)?.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${PRIORITY_COLORS[wo.priority as keyof typeof PRIORITY_COLORS]}`}
                      >
                        {wo.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Alert */}
      {(stats?.breakdownMachines ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">{stats?.breakdownMachines} machine(s) in breakdown status</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
