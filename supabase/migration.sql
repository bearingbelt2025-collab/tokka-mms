-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES TABLE
-- =====================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'technician')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- MACHINES TABLE
-- =====================
create table if not exists public.machines (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  model text,
  serial_number text,
  location text not null,
  status text not null default 'running' check (status in ('running', 'maintenance_due', 'breakdown', 'offline')),
  notes text,
  photo_url text,
  installed_at timestamptz,
  last_maintained_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger update_machines_updated_at
  before update on public.machines
  for each row execute procedure public.update_updated_at_column();

-- =====================
-- WORK ORDERS TABLE
-- =====================
create table if not exists public.work_orders (
  id uuid primary key default uuid_generate_v4(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  title text not null,
  description text,
  issue_type text not null check (issue_type in ('mechanical_failure', 'electrical_issue', 'lubrication', 'calibration', 'part_replacement', 'inspection', 'cleaning', 'other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create or replace trigger update_work_orders_updated_at
  before update on public.work_orders
  for each row execute procedure public.update_updated_at_column();

create index if not exists work_orders_machine_id_idx on public.work_orders(machine_id);
create index if not exists work_orders_status_idx on public.work_orders(status);
create index if not exists work_orders_assigned_to_idx on public.work_orders(assigned_to);

-- =====================
-- PM SCHEDULES TABLE
-- =====================
create table if not exists public.pm_schedules (
  id uuid primary key default uuid_generate_v4(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  task_name text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual')),
  last_done_at timestamptz,
  next_due_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'overdue', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

-- Auto-update PM status based on due date
create or replace function public.update_pm_status()
returns trigger as $$
begin
  if new.next_due_at < now() and new.status = 'upcoming' then
    new.status = 'overdue';
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger check_pm_status
  before insert or update on public.pm_schedules
  for each row execute procedure public.update_pm_status();

create index if not exists pm_schedules_machine_id_idx on public.pm_schedules(machine_id);
create index if not exists pm_schedules_next_due_idx on public.pm_schedules(next_due_at);

-- =====================
-- DOWNTIME LOGS TABLE
-- =====================
create table if not exists public.downtime_logs (
  id uuid primary key default uuid_generate_v4(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  cause text not null,
  description text,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists downtime_logs_machine_id_idx on public.downtime_logs(machine_id);
create index if not exists downtime_logs_start_time_idx on public.downtime_logs(start_time);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.work_orders enable row level security;
alter table public.pm_schedules enable row level security;
alter table public.downtime_logs enable row level security;

-- Profiles: users can read all, update own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Machines: authenticated users can read; admin can write
create policy "machines_select" on public.machines for select using (auth.role() = 'authenticated');
create policy "machines_insert" on public.machines for insert with check (auth.role() = 'authenticated');
create policy "machines_update" on public.machines for update using (auth.role() = 'authenticated');
create policy "machines_delete" on public.machines for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Work Orders
create policy "wo_select" on public.work_orders for select using (auth.role() = 'authenticated');
create policy "wo_insert" on public.work_orders for insert with check (auth.role() = 'authenticated');
create policy "wo_update" on public.work_orders for update using (auth.role() = 'authenticated');
create policy "wo_delete" on public.work_orders for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- PM Schedules
create policy "pm_select" on public.pm_schedules for select using (auth.role() = 'authenticated');
create policy "pm_insert" on public.pm_schedules for insert with check (auth.role() = 'authenticated');
create policy "pm_update" on public.pm_schedules for update using (auth.role() = 'authenticated');
create policy "pm_delete" on public.pm_schedules for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Downtime Logs
create policy "downtime_select" on public.downtime_logs for select using (auth.role() = 'authenticated');
create policy "downtime_insert" on public.downtime_logs for insert with check (auth.role() = 'authenticated');
create policy "downtime_update" on public.downtime_logs for update using (auth.role() = 'authenticated');
create policy "downtime_delete" on public.downtime_logs for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- =====================
-- ENABLE REALTIME
-- =====================
alter publication supabase_realtime add table public.machines;
alter publication supabase_realtime add table public.work_orders;
alter publication supabase_realtime add table public.downtime_logs;
