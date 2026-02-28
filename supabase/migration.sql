-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');
CREATE TYPE machine_status AS ENUM ('operational', 'maintenance', 'breakdown', 'idle', 'decommissioned');
CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'cancelled', 'rejected');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'predictive', 'emergency');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create machines table
CREATE TABLE machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  machine_code TEXT NOT NULL UNIQUE,
  machine_type TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  serial_number TEXT,
  location TEXT NOT NULL,
  department TEXT,
  status machine_status NOT NULL DEFAULT 'operational',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  installation_date DATE,
  specifications JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create maintenance_requests table
CREATE TABLE maintenance_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  machine_id UUID REFERENCES machines(id) ON DELETE RESTRICT NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority request_priority NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'pending',
  maintenance_type maintenance_type NOT NULL DEFAULT 'corrective',
  scheduled_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_duration INTEGER, -- in minutes
  actual_duration INTEGER, -- in minutes
  cost_estimate DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create maintenance_logs table
CREATE TABLE maintenance_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE NOT NULL,
  logged_by UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  time_spent INTEGER, -- in minutes
  parts_used JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create spare_parts table
CREATE TABLE spare_parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2),
  supplier TEXT,
  location_in_warehouse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create request_number generation function
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_request_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM maintenance_requests
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  new_request_number := 'MR-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  NEW.request_number := new_request_number;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_request_number_trigger
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for machines
CREATE POLICY "All authenticated users can view machines" ON machines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and managers can insert machines" ON machines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Admins and managers can update machines" ON machines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- RLS Policies for maintenance_requests
CREATE POLICY "All authenticated users can view requests" ON maintenance_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create requests" ON maintenance_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Requestors and admins can update requests" ON maintenance_requests FOR UPDATE USING (
  auth.uid() = requested_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- RLS Policies for maintenance_logs
CREATE POLICY "All authenticated users can view logs" ON maintenance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create logs" ON maintenance_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for spare_parts
CREATE POLICY "All authenticated users can view spare parts" ON spare_parts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and managers can manage spare parts" ON spare_parts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create indexes for better performance
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_department ON machines(department);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_machine_id ON maintenance_requests(machine_id);
CREATE INDEX idx_maintenance_requests_requested_by ON maintenance_requests(requested_by);
CREATE INDEX idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_maintenance_logs_request_id ON maintenance_logs(request_id);
CREATE INDEX idx_spare_parts_category ON spare_parts(category);