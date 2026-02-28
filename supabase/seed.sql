-- Seed data for Tokka MMS
-- Note: Run this after creating the auth users in Supabase dashboard
-- or use Supabase CLI: supabase db seed

-- Insert sample profiles (UUIDs must match auth.users)
-- These are placeholder UUIDs - replace with actual auth user UUIDs
INSERT INTO profiles (id, email, full_name, role, department, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@tokka.com', 'System Administrator', 'admin', 'IT', true),
  ('00000000-0000-0000-0000-000000000002', 'manager@tokka.com', 'Production Manager', 'manager', 'Production', true),
  ('00000000-0000-0000-0000-000000000003', 'operator1@tokka.com', 'Ahmad Maintenance', 'operator', 'Maintenance', true),
  ('00000000-0000-0000-0000-000000000004', 'operator2@tokka.com', 'Budi Teknisi', 'operator', 'Maintenance', true),
  ('00000000-0000-0000-0000-000000000005', 'viewer@tokka.com', 'Citra Supervisor', 'viewer', 'Production', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample machines
INSERT INTO machines (id, name, machine_code, machine_type, model, manufacturer, serial_number, location, department, status, installation_date) VALUES
  ('10000000-0000-0000-0000-000000000001', 'CNC Milling Machine A1', 'CNC-A1-001', 'CNC Mill', 'VMC-850', 'Haas Automation', 'SN-2020-001', 'Workshop Floor A', 'Production', 'operational', '2020-01-15'),
  ('10000000-0000-0000-0000-000000000002', 'CNC Lathe Machine B1', 'CNC-B1-001', 'CNC Lathe', 'SL-20', 'Haas Automation', 'SN-2020-002', 'Workshop Floor B', 'Production', 'operational', '2020-03-20'),
  ('10000000-0000-0000-0000-000000000003', 'Hydraulic Press C1', 'HYD-C1-001', 'Hydraulic Press', 'HP-100T', 'Pacific Press', 'SN-2019-003', 'Press Room', 'Production', 'maintenance', '2019-06-10'),
  ('10000000-0000-0000-0000-000000000004', 'Welding Robot D1', 'WLD-D1-001', 'Welding Robot', 'ArcMate 100iD', 'FANUC', 'SN-2021-004', 'Welding Station', 'Production', 'operational', '2021-02-28'),
  ('10000000-0000-0000-0000-000000000005', 'Conveyor Belt E1', 'CNV-E1-001', 'Conveyor', 'CB-500', 'FlexLink', 'SN-2018-005', 'Assembly Line 1', 'Production', 'operational', '2018-11-05'),
  ('10000000-0000-0000-0000-000000000006', 'Air Compressor F1', 'AIR-F1-001', 'Compressor', 'GA55', 'Atlas Copco', 'SN-2019-006', 'Utility Room', 'Maintenance', 'operational', '2019-09-15'),
  ('10000000-0000-0000-0000-000000000007', 'Injection Mold G1', 'INJ-G1-001', 'Injection Molder', 'EC180SX', 'Toshiba', 'SN-2022-007', 'Molding Area', 'Production', 'idle', '2022-05-20'),
  ('10000000-0000-0000-0000-000000000008', 'Grinding Machine H1', 'GRD-H1-001', 'Surface Grinder', 'SG-618', 'Okamoto', 'SN-2020-008', 'Finishing Area', 'Production', 'operational', '2020-07-12')
ON CONFLICT (id) DO NOTHING;

-- Insert sample maintenance requests
INSERT INTO maintenance_requests (id, request_number, machine_id, requested_by, assigned_to, title, description, priority, status, maintenance_type, scheduled_date, created_at) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'MR-2024-0001',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Hydraulic Press Seal Replacement',
    'The hydraulic press is showing signs of oil leakage from the main cylinder seal. Needs immediate replacement to prevent further damage.',
    'high',
    'in_progress',
    'corrective',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'MR-2024-0002',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'CNC Mill Monthly Preventive Maintenance',
    'Scheduled monthly preventive maintenance for CNC Milling Machine A1. Includes lubrication, calibration check, and tool inspection.',
    'medium',
    'pending',
    'preventive',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'MR-2024-0003',
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Welding Robot Arm Calibration',
    'Welding robot showing slight deviation in positioning. Requires recalibration of arm joints and welding path programming.',
    'medium',
    'approved',
    'predictive',
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'MR-2024-0004',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'CNC Lathe Spindle Bearing Replacement',
    'Unusual noise detected from spindle. Bearing inspection and replacement required.',
    'critical',
    'completed',
    'corrective',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'MR-2024-0005',
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Air Compressor Filter Replacement',
    'Quarterly filter replacement for air compressor. Includes air filter, oil filter, and separator element.',
    'low',
    'pending',
    'preventive',
    NOW() + INTERVAL '7 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample maintenance logs
INSERT INTO maintenance_logs (id, request_id, logged_by, action, description, time_spent, created_at) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'inspection',
    'Conducted initial inspection. Confirmed oil leak from main cylinder seal. Parts ordered.',
    60,
    NOW() - INTERVAL '2 days'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'parts_received',
    'Seal replacement kit received from supplier. Scheduled replacement for tomorrow.',
    30,
    NOW() - INTERVAL '1 day'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'repair',
    'Replaced spindle bearings (SKF 6205-2RS x2). Machine tested and running smoothly.',
    240,
    NOW() - INTERVAL '5 days'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'completed',
    'Final inspection completed. Machine running at normal specs. Request closed.',
    30,
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample spare parts
INSERT INTO spare_parts (id, part_code, name, description, category, unit, quantity_in_stock, minimum_stock, unit_price, supplier) VALUES
  ('40000000-0000-0000-0000-000000000001', 'SP-HYD-001', 'Hydraulic Cylinder Seal Kit', 'Seal kit for Pacific Press HP-100T hydraulic cylinder', 'Seals & Gaskets', 'set', 5, 2, 250000, 'PT. Hidraulik Jaya'),
  ('40000000-0000-0000-0000-000000000002', 'SP-BRG-001', 'SKF Bearing 6205-2RS', 'Deep groove ball bearing, sealed, 25x52x15mm', 'Bearings', 'pcs', 20, 5, 85000, 'PT. Bearing Indonesia'),
  ('40000000-0000-0000-0000-000000000003', 'SP-BRG-002', 'SKF Bearing 6208-2RS', 'Deep groove ball bearing, sealed, 40x80x18mm', 'Bearings', 'pcs', 10, 3, 120000, 'PT. Bearing Indonesia'),
  ('40000000-0000-0000-0000-000000000004', 'SP-FLT-001', 'Air Compressor Air Filter', 'OEM air filter for Atlas Copco GA55', 'Filters', 'pcs', 8, 3, 450000, 'PT. Atlas Copco Indonesia'),
  ('40000000-0000-0000-0000-000000000005', 'SP-FLT-002', 'Air Compressor Oil Filter', 'OEM oil filter for Atlas Copco GA55', 'Filters', 'pcs', 8, 3, 380000, 'PT. Atlas Copco Indonesia'),
  ('40000000-0000-0000-0000-000000000006', 'SP-FLT-003', 'Air Compressor Separator Element', 'OEM oil separator for Atlas Copco GA55', 'Filters', 'pcs', 4, 2, 750000, 'PT. Atlas Copco Indonesia'),
  ('40000000-0000-0000-0000-000000000007', 'SP-LUB-001', 'Grease Mobilux EP2', 'High performance lithium grease for CNC machines', 'Lubricants', 'kg', 15, 5, 95000, 'PT. ExxonMobil Indonesia'),
  ('40000000-0000-0000-0000-000000000008', 'SP-ELC-001', 'Contactor Schneider LC1D25', '3-pole contactor, 25A, 220VAC coil', 'Electrical', 'pcs', 6, 2, 320000, 'PT. Schneider Electric Indonesia'),
  ('40000000-0000-0000-0000-000000000009', 'SP-ELC-002', 'Circuit Breaker 3P 32A', 'MCB 3 phase 32A for panel distribution', 'Electrical', 'pcs', 10, 3, 185000, 'PT. Hager Indonesia'),
  ('40000000-0000-0000-0000-000000000010', 'SP-BLT-001', 'V-Belt A-42', 'Classical V-Belt size A-42 for conveyor', 'Belts & Chains', 'pcs', 12, 4, 65000, 'PT. Gates Indonesia')
ON CONFLICT (id) DO NOTHING;