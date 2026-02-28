'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  RefreshCw,
  Plus,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalMachines: number
  runningMachines: number
  maintenanceDueMachines: number
  breakdownMachines: number
  openWorkOrders: number
  overdueWorkOrders: number
  overduepmSchedules: number
  totalDowntimeHours: number
}

interface RecentWorkOrder {
  id: string
  title: string
  priority: string
  status: string
  created_at: string
  machines: { name: string } | null
}

interface MachineStatus {
  id: string
  name: string
  status: string
  location: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMachines: 0,
    runningMachines: 0,
    maintenanceDueMachines: 0,
    breakdownMachines: 0,
    openWorkOrders: 0,
    overdueWorkOrders: 0,
    overduepmSchedules: 0,
    totalDowntimeHours: 0,
  })
  const [recentWorkOrders, setRecentWorkOrders] = useState<RecentWorkOrder[]>([])
  const [machineStatuses, setMachineStatuses] = useState<MachineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch machines
      const { data: machines } = await supabase
        .from('machines')
        .select('id, name, status, location')

      // Fetch work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, title, priority, status, created_at, machines(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch all work orders for stats
      const { data: allWorkOrders } = await supabase
        .from('work_orders')
        .select('id, status, due_date')

      // Fetch overdue PM schedules
      const { data: pmSchedules } = await supabase
        .from('pm_schedules')
        .select('id, next_due_date, is_active')
        .eq('is_active', true)

      // Fetch downtime logs
      const { data: downtimeLogs } = await supabase
        .from('downtime_logs')
        .select('duration_minutes')
        .not('duration_minutes', 'is', null)

      const now = new Date()

      setStats({
        totalMachines: machines?.length || 0,
        runningMachines: machines?.filter(m => m.status === 'running').length || 0,
        maintenanceDueMachines: machines?.filter(m => m.status === 'maintenance_due').length || 0,
        breakdownMachines: machines?.filter(m => m.status === 'breakdown').length || 0,
        openWorkOrders: allWorkOrders?.filter(wo => ['open', 'in_progress'].includes(wo.status)).length || 0,
        overdueWorkOrders: allWorkOrders?.filter(wo => {
          if (!wo.due_date || wo.status === 'completed' || wo.status === 'cancelled') return false
          return new Date(wo.due_date) < now
        }).length || 0,
        overduepmSchedules: pmSchedules?.filter(pm => {
          if (!pm.next_due_date) return false
          return new Date(pm.next_due_date) < now
        }).length || 0,
        totalDowntimeHours: Math.round((downtimeLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0) / 60 * 10) / 10,
      })

      setRecentWorkOrders((workOrders as unknown as RecentWorkOrder[]) || [])
      setMachineStatuses(machines || [])
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()

    // Set up Realtime subscription
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime_logs' }, fetchDashboardData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDashboardData, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'maintenance_due': return 'bg-yellow-500'
      case 'breakdown': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    }
    return variants[priority] || 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Link href="/work-orders">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New WO
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-green-600">{stats.runningMachines}</p>
                <p className="text-xs text-muted-foreground">of {stats.totalMachines} machines</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Breakdown</p>
                <p className="text-2xl font-bold text-red-600">{stats.breakdownMachines}</p>
                <p className="text-xs text-muted-foreground">machines down</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open WOs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.openWorkOrders}</p>
                <p className="text-xs text-muted-foreground">{stats.overdueWorkOrders} overdue</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Downtime</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalDowntimeHours}h</p>
                <p className="text-xs text-muted-foreground">total logged</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {(stats.overdueWorkOrders > 0 || stats.overduepmSchedules > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Attention Required</span>
            </div>
            <div className="mt-2 space-y-1">
              {stats.overdueWorkOrders > 0 && (
                <p className="text-sm text-orange-700">
                  {stats.overdueWorkOrders} work order{stats.overdueWorkOrders > 1 ? 's' : ''} overdue
                </p>
              )}
              {stats.overduepmSchedules > 0 && (
                <p className="text-sm text-orange-700">
                  {stats.overduepmSchedules} PM schedule{stats.overduepmSchedules > 1 ? 's' : ''} overdue
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Machine Status Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Machine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {machineStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No machines registered yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {machineStatuses.map((machine) => (
                  <div key={machine.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(machine.status)}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{machine.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{machine.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No work orders yet</p>
            ) : (
              <div className="space-y-2">
                {recentWorkOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">{wo.machines?.name}</p>
                    </div>
                    <Badge variant={getPriorityBadge(wo.priority)} className="text-xs ml-2 flex-shrink-0">
                      {wo.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
