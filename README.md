# TOKKA MMS — Maintenance Management System

A mobile-first maintenance management system for Tokka's nail & wire manufacturing plant. Built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **Machine Registry** — Track all machines with status (running/maintenance due/breakdown), location, photos, and specs
- **Work Orders** — Quick-create in <30 seconds on phone: pick machine, issue type, priority, snap photo
- **Preventive Maintenance** — Recurring schedules per machine with auto-overdue detection
- **Dashboard** — Single-screen view of all key metrics: machine status grid, open WOs, overdue PM, downtime hours
- **Downtime Tracking** — Log when machines go down, live duration counter, automatic status updates
- **Role-Based Access** — Admin (full access) and Technician (assigned work orders, status updates)
- **Real-time Updates** — Live dashboard via Supabase Realtime subscriptions

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Deployment**: Vercel

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Note your **Project URL** and **Anon Key** from: Settings → API

### 2. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy and paste the contents of `supabase/migration.sql`
3. Click **Run** — this creates all tables, indexes, RLS policies, triggers, and enables Realtime

### 3. Create the Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `photos`, set **Public** to ON
4. Add policies:
   - **INSERT**: Authenticated users can upload → Policy: `(bucket_id = 'photos')`
   - **SELECT**: Anyone can view → Policy: `(bucket_id = 'photos')`

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. (Optional) Seed Demo Data

Run `supabase/seed.sql` in the SQL Editor to populate with sample machines, work orders, and PM schedules.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── machines/           # Machine registry
│   │   ├── work-orders/        # Work order management
│   │   ├── pm-schedule/        # Preventive maintenance
│   │   └── downtime/           # Downtime tracking
│   ├── login/
│   │   └── page.tsx            # Auth page
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── *.tsx                   # Shared components
├── contexts/
│   └── auth-context.tsx
├── hooks/
│   ├── use-supabase.ts
│   └── use-toast.ts
├── lib/
│   ├── supabase/               # Supabase client helpers
│   ├── constants.ts
│   └── utils.ts
├── types/
│   └── database.ts             # Generated Supabase types
supabase/
├── migration.sql               # Full schema
└── seed.sql                    # Demo data
```

---

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tokka.id | tokka2024 |
| Technician | tech@tokka.id | tokka2024 |

> **Note**: Change these in production. The seed script creates auth users via Supabase's `auth.users` — you may need to create them manually in the Supabase Auth dashboard if the SQL approach doesn't work in your project.
