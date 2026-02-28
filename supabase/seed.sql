-- Seed data for Tokka MMS
-- Run this in the Supabase SQL Editor after migration.sql

-- =====================
-- CREATE AUTH USERS
-- =====================
-- Note: In production Supabase, you may need to create users via the Auth dashboard
-- or use the service role API. This approach works in local dev.

-- Admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@tokka.id',
  crypt('tokka2024', gen_salt('bf')),
  now(),
  '{"full_name": "Admin Tokka", "role": "admin"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Technician user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'tech@tokka.id',
  crypt('tokka2024', gen_salt('bf')),
  now(),
  '{"full_name": "Budi Teknisi", "role": "technician"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- =====================
-- MACHINES
-- =====================
INSERT INTO public.machines (id, name, model, serial_number, location, status, notes, installed_at) VALUES
  ('m0000001-0000-0000-0000-000000000001', 'Wire Drawing Machine #1', 'WDM-500', 'WDM-001-2020', 'Wire Drawing Line 1', 'running', 'Primary wire drawing unit, 5mm to 0.5mm range', '2020-03-15'),
  ('m0000001-0000-0000-0000-000000000002', 'Wire Drawing Machine #2', 'WDM-500', 'WDM-002-2020', 'Wire Drawing Line 1', 'maintenance_due', 'Secondary unit, due for bearing replacement', '2020-03-15'),
  ('m0000001-0000-0000-0000-000000000003', 'Wire Drawing Machine #3', 'WDM-750', 'WDM-003-2021', 'Wire Drawing Line 2', 'running', 'High-capacity unit for 1mm wire', '2021-06-10'),
  ('m0000001-0000-0000-0000-000000000004', 'Nail Making Machine #1', 'NMM-200', 'NMM-001-2019', 'Nail Making Section', 'running', '200 nails/min capacity', '2019-11-20'),
  ('m0000001-0000-0000-0000-000000000005', 'Nail Making Machine #2', 'NMM-200', 'NMM-002-2019', 'Nail Making Section', 'breakdown', 'Cam shaft broken, awaiting spare part', '2019-11-20'),
  ('m0000001-0000-0000-0000-000000000006', 'Nail Making Machine #3', 'NMM-350', 'NMM-003-2022', 'Nail Making Section', 'running', 'Newest unit, 350 nails/min', '2022-01-05'),
  ('m0000001-0000-0000-0000-000000000007', 'Wire Coiler A', 'WCA-100', 'WCA-001-2020', 'Wire Drawing Line 1', 'running', 'Automatic coiling for finished wire', '2020-04-01'),
  ('m0000001-0000-0000-0000-000000000008', 'Packaging Machine', 'PKG-50', 'PKG-001-2021', 'Packaging Area', 'running', 'Automated nail packaging, 50kg bags', '2021-09-15'),
  ('m0000001-0000-0000-0000-000000000009', 'Air Compressor Main', 'AC-750', 'AC-001-2018', 'Utility Room', 'running', 'Main plant air supply, 750L/min', '2018-06-01'),
  ('m0000001-0000-0000-0000-000000000010', 'Annealing Furnace', 'AF-1000', 'AF-001-2020', 'Wire Drawing Line 2', 'maintenance_due', 'Temperature calibration overdue', '2020-08-20')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- WORK ORDERS
-- =====================
INSERT INTO public.work_orders (id, machine_id, title, description, issue_type, priority, status, assigned_to, created_by, created_at) VALUES
  ('w0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000005', 'Replace broken cam shaft on NMM #2', 'Cam shaft fractured during operation. Machine completely stopped. Spare part ordered from supplier.', 'mechanical_failure', 'critical', 'in_progress', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', now() - interval '2 days'),
  ('w0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000002', 'Bearing replacement WDM #2', 'Abnormal vibration detected. Bearing showing signs of wear.', 'part_replacement', 'high', 'open', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', now() - interval '1 day'),
  ('w0000001-0000-0000-0000-000000000003', 'm0000001-0000-0000-0000-000000000010', 'Temperature calibration annealing furnace', 'Furnace temperature reading inconsistent. Needs thermocouple calibration.', 'calibration', 'medium', 'open', null, 'a0000000-0000-0000-0000-000000000001', now() - interval '3 hours'),
  ('w0000001-0000-0000-0000-000000000004', 'm0000001-0000-0000-0000-000000000001', 'Lubrication WDM #1 - monthly', 'Monthly lubrication for wire drawing dies and guides.', 'lubrication', 'low', 'resolved', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', now() - interval '5 days'),
  ('w0000001-0000-0000-0000-000000000005', 'm0000001-0000-0000-0000-000000000009', 'Air compressor oil change', 'Scheduled oil change for main air compressor.', 'lubrication', 'low', 'closed', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- PM SCHEDULES
-- =====================
INSERT INTO public.pm_schedules (machine_id, task_name, frequency, next_due_at, status, notes) VALUES
  ('m0000001-0000-0000-0000-000000000001', 'Die Lubrication', 'weekly', now() + interval '3 days', 'upcoming', 'Use ISO VG 32 oil'),
  ('m0000001-0000-0000-0000-000000000001', 'Guide Roller Inspection', 'monthly', now() + interval '15 days', 'upcoming', 'Check for wear and alignment'),
  ('m0000001-0000-0000-0000-000000000002', 'Bearing Inspection', 'monthly', now() - interval '5 days', 'overdue', 'Listen for abnormal noise'),
  ('m0000001-0000-0000-0000-000000000003', 'Die Lubrication', 'weekly', now() + interval '5 days', 'upcoming', null),
  ('m0000001-0000-0000-0000-000000000004', 'Nail Die Check', 'weekly', now() + interval '1 day', 'upcoming', 'Check for cracks or deformation'),
  ('m0000001-0000-0000-0000-000000000004', 'Machine Cleaning', 'daily', now() - interval '1 day', 'overdue', 'Remove nail debris and metal filings'),
  ('m0000001-0000-0000-0000-000000000006', 'Nail Die Check', 'weekly', now() + interval '4 days', 'upcoming', null),
  ('m0000001-0000-0000-0000-000000000009', 'Oil Change', 'quarterly', now() + interval '45 days', 'upcoming', 'Use SAE 40 compressor oil'),
  ('m0000001-0000-0000-0000-000000000009', 'Filter Replacement', 'monthly', now() - interval '3 days', 'overdue', 'Replace air intake filter'),
  ('m0000001-0000-0000-0000-000000000010', 'Temperature Calibration', 'quarterly', now() - interval '10 days', 'overdue', 'Calibrate thermocouple against reference')
ON CONFLICT DO NOTHING;

-- =====================
-- DOWNTIME LOGS
-- =====================
INSERT INTO public.downtime_logs (machine_id, cause, description, start_time, end_time, duration_minutes) VALUES
  ('m0000001-0000-0000-0000-000000000005', 'Mechanical Failure', 'Cam shaft fracture, complete shutdown', now() - interval '2 days', null, null),
  ('m0000001-0000-0000-0000-000000000002', 'Scheduled Maintenance', 'Planned bearing inspection and replacement', now() - interval '10 days', now() - interval '10 days' + interval '3 hours', 180),
  ('m0000001-0000-0000-0000-000000000001', 'Electrical Fault', 'Control panel trip, motor overload', now() - interval '15 days', now() - interval '15 days' + interval '45 minutes', 45),
  ('m0000001-0000-0000-0000-000000000004', 'Operator Error', 'Incorrect wire gauge loaded, jam occurred', now() - interval '20 days', now() - interval '20 days' + interval '30 minutes', 30)
ON CONFLICT DO NOTHING;
