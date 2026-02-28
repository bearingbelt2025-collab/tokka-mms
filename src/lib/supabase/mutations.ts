import { createClient } from './client';

export async function addMachine(payload: {
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string;
  status: string;
  notes: string | null;
  installed_at: string | null;
}) {
  const supabase = createClient();
  return supabase.from('machines').insert(payload);
}

export async function updateMachineStatus(machineId: string, status: string) {
  const supabase = createClient();
  return supabase.from('machines').update({ status, last_maintained_at: new Date().toISOString() }).eq('id', machineId);
}

export async function createWorkOrder(payload: {
  machine_id: string;
  title: string;
  description: string | null;
  issue_type: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
}) {
  const supabase = createClient();
  return supabase.from('work_orders').insert(payload);
}

export async function updateWorkOrderStatus(woId: string, status: string) {
  const supabase = createClient();
  const update: any = { status };
  if (status === 'resolved' || status === 'closed') {
    update.resolved_at = new Date().toISOString();
  }
  return supabase.from('work_orders').update(update).eq('id', woId);
}
