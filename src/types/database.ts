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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'operator' | 'viewer'
          department: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'operator' | 'viewer'
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'operator' | 'viewer'
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          machine_code: string
          machine_type: string
          model: string | null
          manufacturer: string | null
          serial_number: string | null
          location: string
          department: string | null
          status: 'operational' | 'maintenance' | 'breakdown' | 'idle' | 'decommissioned'
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          installation_date: string | null
          specifications: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          machine_code: string
          machine_type: string
          model?: string | null
          manufacturer?: string | null
          serial_number?: string | null
          location: string
          department?: string | null
          status?: 'operational' | 'maintenance' | 'breakdown' | 'idle' | 'decommissioned'
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          installation_date?: string | null
          specifications?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          machine_code?: string
          machine_type?: string
          model?: string | null
          manufacturer?: string | null
          serial_number?: string | null
          location?: string
          department?: string | null
          status?: 'operational' | 'maintenance' | 'breakdown' | 'idle' | 'decommissioned'
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          installation_date?: string | null
          specifications?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          request_number: string
          machine_id: string
          requested_by: string
          assigned_to: string | null
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          maintenance_type: 'preventive' | 'corrective' | 'predictive' | 'emergency'
          scheduled_date: string | null
          started_at: string | null
          completed_at: string | null
          estimated_duration: number | null
          actual_duration: number | null
          cost_estimate: number | null
          actual_cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_number?: string
          machine_id: string
          requested_by: string
          assigned_to?: string | null
          title: string
          description: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          maintenance_type?: 'preventive' | 'corrective' | 'predictive' | 'emergency'
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          cost_estimate?: number | null
          actual_cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_number?: string
          machine_id?: string
          requested_by?: string
          assigned_to?: string | null
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          maintenance_type?: 'preventive' | 'corrective' | 'predictive' | 'emergency'
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          cost_estimate?: number | null
          actual_cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_logs: {
        Row: {
          id: string
          request_id: string
          logged_by: string
          action: string
          description: string
          time_spent: number | null
          parts_used: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          logged_by: string
          action: string
          description: string
          time_spent?: number | null
          parts_used?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          logged_by?: string
          action?: string
          description?: string
          time_spent?: number | null
          parts_used?: Json | null
          created_at?: string
        }
      }
      spare_parts: {
        Row: {
          id: string
          part_code: string
          name: string
          description: string | null
          category: string | null
          unit: string
          quantity_in_stock: number
          minimum_stock: number
          unit_price: number | null
          supplier: string | null
          location_in_warehouse: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_code: string
          name: string
          description?: string | null
          category?: string | null
          unit?: string
          quantity_in_stock?: number
          minimum_stock?: number
          unit_price?: number | null
          supplier?: string | null
          location_in_warehouse?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          part_code?: string
          name?: string
          description?: string | null
          category?: string | null
          unit?: string
          quantity_in_stock?: number
          minimum_stock?: number
          unit_price?: number | null
          supplier?: string | null
          location_in_warehouse?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}