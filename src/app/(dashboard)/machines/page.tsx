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
  CardTitle,
  CardDescription
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
  Wrench,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Tag
} from 'lucide-react'
import { createClient as createStorageClient } from '@/lib/supabase/client'

type MachineStatus = 'running' | 'maintenance_due' | 'breakdown' | 'decommissioned'

interface Machine {
  id: string
  name: string
  model: string | null
  serial_number: string | null
  location: string
  status: MachineStatus
  photo_url: string | null
  notes: string | null
  created_at: string
}

const statusConfig = {
  running: { label: 'Running', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, dot: 'bg-green-500' },
  maintenance_due: { label: 'Maint. Due', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Wrench, dot: 'bg-yellow-500' },
  breakdown: { label: 'Breakdown', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, dot: 'bg-red-500' },
  decommissioned: { label: 'Decommissioned', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: RefreshCw, dot: 'bg-gray-400' },
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    location: '',
    status: 'running' as MachineStatus,
    notes: '',
  })

  const fetchMachines = useCallback(async () => {
    const { data } = await supabase
      .from('machines')
      .select('*')
      .order('name')
    setMachines(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchMachines()
    const channel = supabase
      .channel('machines-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchMachines)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchMachines, supabase])

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (machine.model && machine.model.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (machineId: string): Promise<string | null> => {
    if (!photoFile) return editingMachine?.photo_url || null
    setUploading(true)
    const storage = createStorageClient()
    const ext = photoFile.name.split('.').pop()
    const fileName = `${machineId}-${Date.now()}.${ext}`
    const { error } = await storage.storage
      .from('photos')
      .upload(fileName, photoFile, { upsert: true })
    setUploading(false)
    if (error) { console.error('Upload error:', error); return null }
    const { data } = storage.storage.from('photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.location) return
    setSaving(true)

    try {
      if (editingMachine) {
        const photoUrl = await uploadPhoto(editingMachine.id)
        const { error } = await supabase
          .from('machines')
          .update({ ...formData, photo_url: photoUrl, updated_at: new Date().toISOString() })
          .eq('id', editingMachine.id)
        if (error) throw error
      } else {
        const tempId = crypto.randomUUID()
        const photoUrl = await uploadPhoto(tempId)
        const { error } = await supabase
          .from('machines')
          .insert([{ ...formData, photo_url: photoUrl }])
        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      fetchMachines()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('machines').delete().eq('id', id)
    fetchMachines()
  }

  const resetForm = () => {
    setFormData({ name: '', model: '', serial_number: '', location: '', status: 'running', notes: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditingMachine(null)
  }

  const openEditDialog = (machine: Machine) => {
    setEditingMachine(machine)
    setFormData({
      name: machine.name,
      model: machine.model || '',
      serial_number: machine.serial_number || '',
      location: machine.location,
      status: machine.status,
      notes: machine.notes || '',
    })
    setPhotoPreview(machine.photo_url)
    setDialogOpen(true)
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
        <h1 className="text-2xl font-bold">Machines</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add Machine'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Machine Name *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Wire Drawing Machine #1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={formData.model} onChange={e => setFormData(p => ({ ...p, model: e.target.value }))} placeholder="WD-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serial">Serial No.</Label>
                  <Input id="serial" value={formData.serial_number} onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))} placeholder="SN-12345" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Bay A - Row 1" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: MachineStatus) => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="maintenance_due">Maintenance Due</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Photo</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="max-h-32 mx-auto rounded object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="h-8 w-8" />
                      <span className="text-sm">Tap to add photo</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={saving || uploading}>
                {saving || uploading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingMachine ? 'Save Changes' : 'Add Machine'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search machines..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="maintenance_due">Maint. Due</SelectItem>
            <SelectItem value="breakdown">Breakdown</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Machine Cards */}
      {filteredMachines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No machines found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first machine to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredMachines.map((machine) => {
            const config = statusConfig[machine.status]
            const StatusIcon = config.icon
            return (
              <Card key={machine.id} className="overflow-hidden">
                {machine.photo_url && (
                  <div className="h-32 overflow-hidden">
                    <img src={machine.photo_url} alt={machine.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                        <h3 className="font-semibold text-sm truncate">{machine.name}</h3>
                      </div>
                      {machine.model && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{machine.model}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{machine.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => openEditDialog(machine)}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Machine?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {machine.name} and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(machine.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
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
