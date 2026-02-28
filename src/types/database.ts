export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      machines: {
        Row: {
          id: string
          name: string
          model: string | null
          serial_number: string | null
          location: string
          status: string
          notes: string | null
          photo_url: string | null
          installed_at: string | null
          last_maintained_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model?: string | null
          serial_number?: string | null
          location: string
          status?: string
          notes?: string | null
          photo_url?: string | null
          installed_at?: string | null
          last_maintained_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string | null
          serial_number?: string | null
          location?: string
          status?: string
          notes?: string | null
          photo_url?: string | null
          installed_at?: string | null
          last_maintained_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          created_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          machine_id: string
          title: string
          description: string | null
          issue_type: string
          priority: string
          status: string
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          machine_id: string
          title: string
          description?: string | null
          issue_type: string
          priority: string
          status?: string
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          machine_id?: string
          title?: string
          description?: string | null
          issue_type?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      pm_schedules: {
        Row: {
          id: string
          machine_id: string
          task_name: string
          frequency: string
          last_done_at: string | null
          next_due_at: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          task_name: string
          frequency: string
          last_done_at?: string | null
          next_due_at: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          task_name?: string
          frequency?: string
          last_done_at?: string | null
          next_due_at?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      downtime_logs: {
        Row: {
          id: string
          machine_id: string
          cause: string
          description: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          cause: string
          description?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          cause?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
