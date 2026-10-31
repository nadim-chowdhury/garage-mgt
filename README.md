# গ্যারেজ ব্যবস্থাপনা সফটওয়্যার (Garage Management System)

A full-stack, multi-garage management system built for Bangladeshi garages. Manage tenants, vehicles, daily entries, rent payments, income, expenses, reports — all with role-based access control.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Neon PostgreSQL (`@neondatabase/serverless`)
- **State**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS v4
- **Auth**: JWT (`jose`) + bcryptjs + httpOnly cookies
- **Icons**: Lucide React
- **Language**: TypeScript (strict)

## Features

### Multi-Garage & Auth
- **Multi-garage isolation** — each garage's data is completely separated via `garage_id`
- **Phone + password authentication** with JWT sessions in httpOnly cookies
- **Role-based access**: Admin (full CRUD + delete), Operator (create/edit), Viewer (read-only)
- **Proxy-level redirect** — unauthenticated users redirected to `/login`

### Core Modules
- **Dashboard** — 8 aggregate stat cards, recent entries, overdue rents
- **Tenants** — full CRUD, search, status filter, modal-based creation
- **Vehicles** — CRUD linked to tenants, search
- **Daily Vehicle Entries** — date-based log with charge/payment tracking
- **Monthly Rent** — record payments, filter by month/year/status
- **Income & Expenses** — category-based tracking with date range filters
- **Cash Book** — daily income/expense summary with opening/closing balance
- **Dues** — aggregated rent and daily entry dues

### Reports (6 types)
- Daily Collection, Income & Expense Summary, Profit & Loss
- Payment History, Tenant Ledger, Vehicle Ledger
- CSV export + print support on all reports

### UI/UX
- 18 reusable UI components (Button, Table, Modal, StatCard, FilterPills, etc.)
- Lucide icons throughout (zero emojis)
- Mobile-responsive tables with `hideOnMobile` column support
- Bottom-sheet modals on mobile, centered on desktop
- Toast notifications, confirm dialogs, loading skeletons
- Error boundary + custom 404 page

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="your-secure-random-secret-at-least-32-chars"
```

### 3. Run Database Migration

This creates all 8 tables (garages, users, tenants, vehicles, daily_vehicle_entries, income_entries, expense_entries, rent_payments):

```bash
npx tsx --env-file=.env.local lib/migrate.ts
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Register First Admin

Open `http://localhost:3000/register` and create your first garage + admin account. Registration is only available when no users exist in the database.

## Project Structure

```
├── app/
│   ├── api/                    # API routes (17 endpoints)
│   │   ├── auth/               # login, logout, me, register
│   │   ├── tenants/            # CRUD + [id]
│   │   ├── vehicles/           # CRUD + [id]
│   │   ├── daily-entries/      # list + create
│   │   ├── income/             # list + create
│   │   ├── expenses/           # list + create
│   │   ├── rent-payments/      # list + create
│   │   ├── dashboard/          # aggregate stats
│   │   ├── cash-book/          # daily summary
│   │   └── reports/[...slug]/  # 6 report types
│   ├── login/                  # Auth pages
│   ├── register/
│   ├── tenants/                # Tenant pages
│   ├── vehicles/               # Vehicle pages
│   ├── daily-entries/          # Daily entry page
│   ├── monthly-rent/           # Rent management
│   ├── income/                 # Income tracking
│   ├── expenses/               # Expense tracking
│   ├── cash-book/              # Cash book
│   ├── dues/                   # Due management
│   ├── reports/                # Report hub + 6 sub-pages
│   └── page.tsx                # Dashboard
├── components/
│   ├── ui/                     # 18 reusable UI components
│   ├── layout/                 # AppShell, Header, Sidebar
│   ├── forms/                  # TenantForm, VehicleForm
│   └── providers/              # AuthProvider
├── store/
│   ├── api/                    # 8 RTK Query slices + baseApi
│   ├── store.ts                # Redux store
│   └── provider.tsx            # StoreProvider
├── lib/
│   ├── db.ts                   # Neon database client
│   ├── auth.ts                 # JWT + bcrypt utilities
│   ├── api-auth.ts             # API route auth wrappers
│   ├── utils.ts                # Formatters, helpers
│   ├── csv.ts                  # CSV generation
│   ├── schema.sql              # Database schema (v2)
│   └── migrate.ts              # Migration script
├── types/                      # TypeScript type definitions
└── proxy.ts                    # Next.js proxy (auth redirect)
```

## Auth Architecture

```
Browser → proxy.ts (cookie check) → API route → withAuth() (JWT verify) → handler
                                                  └─ withWriteAuth() (role ≥ operator)
                                                  └─ withAdminAuth() (role = admin)
```

- `proxy.ts` does an optimistic cookie-presence check and redirects to `/login` if missing
- API routes use `withAuth()`, `withWriteAuth()`, `withAdminAuth()` wrappers for real JWT verification
- Sessions stored as httpOnly cookies (not accessible from JavaScript)

## Adding Users

After the first admin is registered, additional users must be added directly in the database:

```sql
INSERT INTO users (phone, password_hash, name, role, garage_id)
VALUES ('01XXXXXXXXX', '<bcrypt_hash>', 'User Name', 'operator', '<garage_uuid>');
```

Roles: `admin`, `operator`, `viewer`

## Currency & Locale

- All amounts displayed in BDT (৳)
- Dates formatted as dd/MM/yyyy
- Timezone: Asia/Dhaka

## License

Private — All rights reserved.
