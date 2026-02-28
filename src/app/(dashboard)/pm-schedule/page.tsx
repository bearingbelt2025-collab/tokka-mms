'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  Clock
} from 'lucide-react'

type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

interface Machine {
  id: string
  name: string
  location: string
}

interface PMSchedule {
  id: string
  machine_id: string
  task_name: string
  description: string | null
  frequency: Frequency
  last_completed_date: string | null
  next_due_date: string | null
  is_active: boolean
  created_at: string
  machines: { name: string; location: string } | null
}

const frequencyLabels: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
}

export default function PMSchedulePage() {
  const [schedules, setSchedules] = useState<PMSchedule[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<PMSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'upcoming' | 'inactive'>('all')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    machine_id: '',
    task_name: '',
    description: '',
    frequency: 'monthly' as Frequency,
    next_due_date: '',
    is_active: true,
  })

  const fetchData = useCallback(async () => {
    const [{ data: sched }, { data: macs }] = await Promise.all([
      supabase.from('pm_schedules').select('*, machines(name, location)').order('next_due_date', { ascending: true, nullsFirst: false }),
      supabase.from('machines').select('id, name, location').order('name'),
    ])
    setSchedules((sched as unknown as PMSchedule[]) || [])
    setMachines(macs || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const filteredSchedules = schedules.filter(s => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'inactive') return !s.is_active
    if (!s.is_active) return false
    if (!s.next_due_date) return filterStatus === 'all'
    const dueDate = new Date(s.next_due_date)
    if (filterStatus === 'overdue') return dueDate < now
    if (filterStatus === 'upcoming') return dueDate >= now && dueDate <= sevenDaysFromNow
    return true
  })

  const getStatusInfo = (schedule: PMSchedule) => {
    if (!schedule.is_active) return { label: 'Inactive', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock }
    if (!schedule.next_due_date) return { label: 'No date set', color: 'text-gray-500', bg: 'bg-gray-100', icon: Calendar }
    const dueDate = new Date(schedule.next_due_date)
    if (dueDate < now) return { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
    if (dueDate <= sevenDaysFromNow) return { label: 'Due Soon', color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock }
    return { label: 'On Track', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle }
  }

  const handleSubmit = async () => {
    if (!formData.machine_id || !formData.task_name) return
    setSaving(true)
    try {
      const payload = {
        ...formData,
        next_due_date: formData.next_due_date || null,
        description: formData.description || null,
      }
      if (editingSchedule) {
        const { error } = await supabase.from('pm_schedules').update(payload).eq('id', editingSchedule.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pm_schedules').insert([payload])
        if (error) throw error
      }
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkComplete = async (schedule: PMSchedule) => {
    const today = new Date().toISOString().split('T')[0]
    const nextDue = calculateNextDue(schedule.frequency)
    await supabase.from('pm_schedules').update({
      last_completed_date: today,
      next_due_date: nextDue,
    }).eq('id', schedule.id)
    fetchData()
  }

  const calculateNextDue = (frequency: Frequency): string => {
    const date = new Date()
    switch (frequency) {
      case 'daily': date.setDate(date.getDate() + 1); break
      case 'weekly': date.setDate(date.getDate() + 7); break
      case 'monthly': date.setMonth(date.getMonth() + 1); break
      case 'quarterly': date.setMonth(date.getMonth() + 3); break
      case 'semi_annual': date.setMonth(date.getMonth() + 6); break
      case 'annual': date.setFullYear(date.getFullYear() + 1); break
    }
    return date.toISOString().split('T')[0]
  }

  const handleDelete = async (id: string) => {
    await supabase.from('pm_schedules').delete().eq('id', id)
    fetchData()
  }

  const resetForm = () => {
    setFormData({ machine_id: '', task_name: '', description: '', frequency: 'monthly', next_due_date: '', is_active: true })
    setEditingSchedule(null)
  }

  const openEditDialog = (schedule: PMSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      machine_id: schedule.machine_id,
      task_name: schedule.task_name,
      description: schedule.description || '',
      frequency: schedule.frequency,
      next_due_date: schedule.next_due_date ? schedule.next_due_date.split('T')[0] : '',
      is_active: schedule.is_active,
    })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const overdueCount = schedules.filter(s => s.is_active && s.next_due_date && new Date(s.next_due_date) < now).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PM Schedule</h1>
          {overdueCount > 0 && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overdueCount} task{overdueCount > 1 ? 's' : ''} overdue
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add PM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Edit PM Schedule' : 'Add PM Schedule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Machine *</Label>
                <Select value={formData.machine_id} onValueChange={v => setFormData(p => ({ ...p, machine_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                  <SelectContent>
                    {machines.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} — {m.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Task Name *</Label>
                <Input value={formData.task_name} onChange={e => setFormData(p => ({ ...p, task_name: e.target.value }))} placeholder="e.g. Oil filter replacement" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v: Frequency) => setFormData(p => ({ ...p, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Next Due Date</Label>
                  <Input type="date" value={formData.next_due_date} onChange={e => setFormData(p => ({ ...p, next_due_date: e.target.value }))} />
                </div>
              </div>
              {editingSchedule && (
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={v => setFormData(p => ({ ...p, is_active: v === 'active' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingSchedule ? 'Save Changes' : 'Add Schedule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={(v: typeof filterStatus) => setFilterStatus(v)}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Schedules</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="upcoming">Due This Week</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* PM Schedule Cards */}
      {filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No PM schedules found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => {
            const statusInfo = getStatusInfo(schedule)
            const StatusIcon = statusInfo.icon
            return (
              <Card key={schedule.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{frequencyLabels[schedule.frequency]}</span>
                      </div>
                      <h3 className="font-semibold text-sm mt-1">{schedule.task_name}</h3>
                      <p className="text-xs text-muted-foreground">{schedule.machines?.name} — {schedule.machines?.location}</p>
                      {schedule.next_due_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {new Date(schedule.next_due_date).toLocaleDateString()}
                        </p>
                      )}
                      {schedule.last_completed_date && (
                        <p className="text-xs text-muted-foreground">
                          Last done: {new Date(schedule.last_completed_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {schedule.is_active && (
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleMarkComplete(schedule)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Mark Done
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => openEditDialog(schedule)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete PM Schedule?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this PM schedule.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(schedule.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
