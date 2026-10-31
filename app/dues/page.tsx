'use client';

import { useState } from 'react';
import { useGetRentPaymentsQuery } from '@/store/api/rentPaymentApi';
import { useGetDailyEntriesQuery } from '@/store/api/dailyEntryApi';
import { Card, Badge, Table, StatCard } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import type { RentPayment, DailyVehicleEntry } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Home, Car, ClipboardList, AlertTriangle } from 'lucide-react';

interface RentRow extends RentPayment {
  tenantName?: string;
  tenantMobile?: string;
}

export default function DuesPage() {
  const [activeTab, setActiveTab] = useState<'rent' | 'daily'>('rent');

  const { data: rentData, isLoading: rentLoading } = useGetRentPaymentsQuery({ limit: 100, status: 'overdue' });
  const { data: partialRentData } = useGetRentPaymentsQuery({ limit: 100, status: 'partial' });
  const { data: unpaidRentData } = useGetRentPaymentsQuery({ limit: 100, status: 'unpaid' });
  const { data: dailyData, isLoading: dailyLoading } = useGetDailyEntriesQuery({ limit: 100, status: 'unpaid' });
  const { data: dailyPartialData } = useGetDailyEntriesQuery({ limit: 100, status: 'partial' });

  const overdueRents = (rentData?.data ?? []) as unknown as RentRow[];
  const partialRents = (partialRentData?.data ?? []) as unknown as RentRow[];
  const unpaidRents = (unpaidRentData?.data ?? []) as unknown as RentRow[];
  const allRentDues = [...overdueRents, ...partialRents, ...unpaidRents];

  const unpaidDaily = (dailyData?.data ?? []) as unknown as DailyVehicleEntry[];
  const partialDaily = (dailyPartialData?.data ?? []) as unknown as DailyVehicleEntry[];
  const allDailyDues = [...unpaidDaily, ...partialDaily];

  const totalRentDue = allRentDues.reduce((sum, r) => sum + Number(r.dueAmount), 0);
  const totalDailyDue = allDailyDues.reduce((sum, r) => sum + (Number(r.chargeAmount) - Number(r.paidAmount)), 0);

  const tabs = [
    { key: 'rent' as const, label: 'Monthly Rent Dues', count: allRentDues.length },
    { key: 'daily' as const, label: 'Daily Entry Dues', count: allDailyDues.length },
  ];

  const rentColumns: Column<RentRow>[] = [
    { key: 'tenantName', header: 'Tenant', render: (r) => (
      <div><p className="font-medium">{r.tenantName}</p><p className="text-xs text-slate-400">{r.tenantMobile}</p></div>
    )},
    { key: 'period', header: 'Period', render: (r) => `${r.rentMonth}/${r.rentYear}` },
    { key: 'rentAmount', header: 'Rent', render: (r) => formatCurrency(r.rentAmount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => formatCurrency(r.paidAmount) },
    { key: 'dueAmount', header: 'Due', render: (r) => <span className="font-semibold text-red-600">{formatCurrency(r.dueAmount)}</span> },
    { key: 'paymentStatus', header: 'Status', render: (r) => (
      <Badge variant={r.paymentStatus === 'overdue' ? 'danger' : r.paymentStatus === 'partial' ? 'warning' : 'neutral'}>
        {r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)}
      </Badge>
    )},
  ];

  const dailyColumns: Column<DailyVehicleEntry>[] = [
    { key: 'vehicleNumber', header: 'Vehicle', render: (r) => <span className="font-medium">{r.vehicleNumber}</span> },
    { key: 'entryDate', header: 'Date', render: (r) => r.entryDate },
    { key: 'chargeAmount', header: 'Charge', render: (r) => formatCurrency(r.chargeAmount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => formatCurrency(r.paidAmount) },
    { key: 'due', header: 'Due', render: (r) => <span className="font-semibold text-red-600">{formatCurrency(r.chargeAmount - r.paidAmount)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dues & Collections</h1>
        <p className="mt-1 text-sm text-slate-500">বকেয়া ও আদায়ের হিসাব</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Monthly Rent Dues" value={formatCurrency(totalRentDue)} icon={<Home className="h-5 w-5" />} color="danger" />
        <StatCard title="Daily Entry Dues" value={formatCurrency(totalDailyDue)} icon={<Car className="h-5 w-5" />} color="warning" />
        <StatCard title="Total Dues" value={formatCurrency(totalRentDue + totalDailyDue)} icon={<ClipboardList className="h-5 w-5" />} color="danger" />
        <StatCard title="Overdue Rents" value={overdueRents.length} icon={<AlertTriangle className="h-5 w-5" />} color="warning" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {activeTab === 'rent' ? (
          <Table columns={rentColumns} data={allRentDues} loading={rentLoading}
            emptyMessage="No rent dues — all clear!" emptyIcon={<CheckCircle className="h-6 w-6" />} keyExtractor={(r) => r.id} />
        ) : (
          <Table columns={dailyColumns} data={allDailyDues} loading={dailyLoading}
            emptyMessage="No daily entry dues — all clear!" emptyIcon={<CheckCircle className="h-6 w-6" />} keyExtractor={(r) => r.id} />
        )}
      </div>
    </div>
  );
}

