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

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── layout.tsx         # Sidebar + mobile nav
│   │   ├── page.tsx            # Dashboard home
│   │   ├── machines/           # Machine registry
│   │   ├── work-orders/        # Work order management
│   │   └── pm-schedule/        # Preventive maintenance
│   ├── login/               # Auth page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── providers/           # Context providers
├── lib/
│   └── supabase/            # Supabase client, helpers
└── middleware.ts            # Auth middleware
supabase/
└── migration.sql            # Full DB schema
```

---

## Default Login

After running the migration, create your first admin user via Supabase Auth dashboard or the SQL editor:

```sql
-- Insert admin profile after creating user via Supabase Auth
INSERT INTO profiles (id, name, role)
VALUES ('your-auth-user-uuid', 'Admin', 'admin');
```

---

## Mobile Usage

The app is optimized for phone use:
- Bottom navigation bar on mobile
- Large tap targets (min 44px)
- Camera integration for photos
- Offline-friendly optimistic updates

---

## License

Private — Tokka Manufacturing
