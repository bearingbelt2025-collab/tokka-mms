'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Search,
  Camera,
  RefreshCw,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  XCircle
} from 'lucide-react'

type WOStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
type WOPriority = 'low' | 'medium' | 'high' | 'critical'
type IssueType = 'mechanical' | 'electrical' | 'hydraulic' | 'pneumatic' | 'lubrication' | 'inspection' | 'other'

interface Machine {
  id: string
  name: string
  location: string
}

interface WorkOrder {
  id: string
  title: string
  description: string | null
  machine_id: string
  priority: WOPriority
  status: WOStatus
  issue_type: IssueType
  photo_url: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  machines: { name: string; location: string } | null
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
}

const statusConfig = {
  open: { label: 'Open', icon: Clock, color: 'text-blue-600' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-orange-600' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-500' },
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    machine_id: '',
    priority: 'medium' as WOPriority,
    status: 'open' as WOStatus,
    issue_type: 'mechanical' as IssueType,
    due_date: '',
  })

  const fetchData = useCallback(async () => {
    const [{ data: wos }, { data: macs }] = await Promise.all([
      supabase.from('work_orders').select('*, machines(name, location)').order('created_at', { ascending: false }),
      supabase.from('machines').select('id, name, location').order('name'),
    ])
    setWorkOrders((wos as unknown as WorkOrder[]) || [])
    setMachines(macs || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('work-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, supabase])

  const filteredWOs = workOrders.filter(wo => {
    const matchesSearch = wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.machines?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && ['open', 'in_progress'].includes(wo.status)) ||
      wo.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || wo.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (woId: string): Promise<string | null> => {
    if (!photoFile) return editingWO?.photo_url || null
    const ext = photoFile.name.split('.').pop()
    const fileName = `wo-${woId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, photoFile, { upsert: true })
    if (error) { console.error('Upload error:', error); return null }
    const { data } = supabase.storage.from('photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.machine_id) return
    setSaving(true)
    try {
      if (editingWO) {
        const photoUrl = await uploadPhoto(editingWO.id)
        const updateData: Record<string, unknown> = {
          ...formData,
          photo_url: photoUrl,
          due_date: formData.due_date || null,
        }
        if (formData.status === 'completed' && editingWO.status !== 'completed') {
          updateData.completed_at = new Date().toISOString()
        }
        const { error } = await supabase.from('work_orders').update(updateData).eq('id', editingWO.id)
        if (error) throw error
      } else {
        const tempId = crypto.randomUUID()
        const photoUrl = await uploadPhoto(tempId)
        const { error } = await supabase.from('work_orders').insert([{
          ...formData,
          photo_url: photoUrl,
          due_date: formData.due_date || null,
        }])
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

  const handleDelete = async (id: string) => {
    await supabase.from('work_orders').delete().eq('id', id)
    fetchData()
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', machine_id: '', priority: 'medium', status: 'open', issue_type: 'mechanical', due_date: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditingWO(null)
  }

  const openEditDialog = (wo: WorkOrder) => {
    setEditingWO(wo)
    setFormData({
      title: wo.title,
      description: wo.description || '',
      machine_id: wo.machine_id,
      priority: wo.priority,
      status: wo.status,
      issue_type: wo.issue_type,
      due_date: wo.due_date ? wo.due_date.split('T')[0] : '',
    })
    setPhotoPreview(wo.photo_url)
    setDialogOpen(true)
  }

  const isOverdue = (wo: WorkOrder) => {
    if (!wo.due_date || ['completed', 'cancelled'].includes(wo.status)) return false
    return new Date(wo.due_date) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New WO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWO ? 'Edit Work Order' : 'New Work Order'}</DialogTitle>
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
                <Label>Title *</Label>
                <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Replace worn belt" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Additional details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v: WOPriority) => setFormData(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Issue Type</Label>
                  <Select value={formData.issue_type} onValueChange={(v: IssueType) => setFormData(p => ({ ...p, issue_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hydraulic">Hydraulic</SelectItem>
                      <SelectItem value="pneumatic">Pneumatic</SelectItem>
                      <SelectItem value="lubrication">Lubrication</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editingWO && (
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: WOStatus) => setFormData(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Photo</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="max-h-28 mx-auto rounded object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Add photo</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingWO ? 'Save Changes' : 'Create Work Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search work orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Work Order Cards */}
      {filteredWOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No work orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWOs.map((wo) => {
            const pConfig = priorityConfig[wo.priority]
            const sConfig = statusConfig[wo.status]
            const StatusIcon = sConfig.icon
            const overdue = isOverdue(wo)
            return (
              <Card key={wo.id} className={overdue ? 'border-orange-300' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pConfig.color}`}>
                          {pConfig.label}
                        </span>
                        {overdue && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mt-1">{wo.title}</h3>
                      <p className="text-xs text-muted-foreground">{wo.machines?.name} — {wo.machines?.location}</p>
                      {wo.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{wo.description}</p>}
                    </div>
                    {wo.photo_url && (
                      <img src={wo.photo_url} alt="WO" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className={`flex items-center gap-1 text-xs ${sConfig.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>{sConfig.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEditDialog(wo)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this work order.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(wo.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
