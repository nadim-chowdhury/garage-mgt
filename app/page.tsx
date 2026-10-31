'use client';

import Link from 'next/link';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';
import { useGetDailyEntriesQuery } from '@/store/api/dailyEntryApi';
import { useGetRentPaymentsQuery } from '@/store/api/rentPaymentApi';
import { StatCard, Card, Table, Badge, Button, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { DailyVehicleEntry, RentPayment } from '@/types';
import { formatCurrency, getVehicleTypeLabel } from '@/lib/utils';
import { Wallet, CreditCard, ClipboardList, Users, Car, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface RentRow extends RentPayment {
  tenantName?: string;
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const { canWrite } = useAuth();

  const { data: statsRes, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: entriesRes } = useGetDailyEntriesQuery({ limit: 8, date: today });
  const { data: overdueRes } = useGetRentPaymentsQuery({ limit: 8, status: 'overdue' });

  const stats = statsRes?.data;
  const recentEntries = (entriesRes?.data ?? []) as unknown as DailyVehicleEntry[];
  const overdueRents = (overdueRes?.data ?? []) as unknown as RentRow[];

  if (statsLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const entryColumns: Column<DailyVehicleEntry>[] = [
    { key: 'vehicleNumber', header: 'Vehicle', render: (r) => <span className="font-medium">{r.vehicleNumber}</span> },
    { key: 'vehicleType', header: 'Type', render: (r) => getVehicleTypeLabel(r.vehicleType) },
    { key: 'chargeAmount', header: 'Charge', render: (r) => formatCurrency(r.chargeAmount) },
    { key: 'paymentStatus', header: 'Status', render: (r) => (
      <Badge variant={r.paymentStatus === 'paid' ? 'success' : r.paymentStatus === 'partial' ? 'warning' : 'neutral'}>
        {r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)}
      </Badge>
    )},
  ];

  const overdueColumns: Column<RentRow>[] = [
    { key: 'tenantName', header: 'Tenant', render: (r) => <span className="font-medium">{r.tenantName}</span> },
    { key: 'period', header: 'Period', render: (r) => `${r.rentMonth}/${r.rentYear}` },
    { key: 'dueAmount', header: 'Due', render: (r) => <span className="font-semibold text-red-600">{formatCurrency(r.dueAmount)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">গ্যারেজের বর্তমান পরিস্থিতি এক নজরে দেখুন</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Today's Income" value={formatCurrency(stats?.todayIncome ?? 0)} icon={<Wallet className="h-5 w-5" />} color="success" />
        <StatCard title="Today's Expenses" value={formatCurrency(stats?.todayExpense ?? 0)} icon={<CreditCard className="h-5 w-5" />} color="danger" />
        <StatCard title="Total Dues" value={formatCurrency(stats?.totalDues ?? 0)} icon={<ClipboardList className="h-5 w-5" />} color="warning" />
        <StatCard title="Active Tenants" value={stats?.activeTenants ?? 0} icon={<Users className="h-5 w-5" />} color="primary" />
        <StatCard title="Today's Vehicles" value={stats?.todayVehicles ?? 0} icon={<Car className="h-5 w-5" />} color="neutral" />
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Monthly Income" value={formatCurrency(stats?.monthlyIncome ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="success" />
        <StatCard title="Monthly Expenses" value={formatCurrency(stats?.monthlyExpense ?? 0)} icon={<TrendingDown className="h-5 w-5" />} color="danger" />
        <StatCard title="Overdue Rents" value={stats?.overdueRents ?? 0} icon={<AlertTriangle className="h-5 w-5" />} color="warning" />
      </div>

      {/* Quick actions */}
      {canWrite && (
        <div className="flex flex-wrap gap-3" data-no-print>
          <Link href="/daily-entries"><Button>New Vehicle Entry</Button></Link>
          <Link href="/monthly-rent"><Button variant="secondary">Record Rent</Button></Link>
          <Link href="/income"><Button variant="secondary">Add Income</Button></Link>
          <Link href="/expenses"><Button variant="secondary">Add Expense</Button></Link>
        </div>
      )}

      {/* Recent entries & overdue rents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent Daily Entries" noPadding>
          <Table columns={entryColumns} data={recentEntries} emptyMessage="No entries yet today" emptyIcon={<Car className="h-6 w-6" />} keyExtractor={(r) => r.id} />
        </Card>

        <Card title="Overdue Rents" noPadding>
          <Table columns={overdueColumns} data={overdueRents} emptyMessage="No overdue rents — all clear!" emptyIcon={<CheckCircle className="h-6 w-6" />} keyExtractor={(r) => r.id} />
        </Card>
      </div>
    </div>
  );
}
