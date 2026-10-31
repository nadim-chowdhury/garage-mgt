'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetTenantLedgerQuery } from '@/store/api/reportApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { Card, Select, Table, Badge, LoadingSpinner, EmptyState, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import type { RentPayment, IncomeEntry } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusLabel, getPaymentMethodLabel, getIncomeCategoryLabel } from '@/lib/utils';
import { Home, Wallet, Users } from 'lucide-react';

export default function TenantLedgerPage() {
  const [tenantId, setTenantId] = useState('');
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 200 });
  const { data, isLoading, isFetching } = useGetTenantLedgerQuery(
    { tenantId },
    { skip: !tenantId },
  );

  const tenants = tenantsRes?.data ?? [];
  const report = data?.data;

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
      paid: 'success', partial: 'warning', unpaid: 'neutral', overdue: 'danger',
    };
    return <Badge variant={map[status] ?? 'neutral'}>{getPaymentStatusLabel(status as RentPayment['paymentStatus'])}</Badge>;
  };

  const rentColumns: Column<RentPayment>[] = [
    { key: 'rentMonth', header: 'Month', render: (r) => `${String(r.rentMonth).padStart(2, '0')}/${r.rentYear}` },
    { key: 'rentAmount', header: 'Rent', render: (r) => formatCurrency(r.rentAmount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(r.paidAmount)}</span> },
    { key: 'dueAmount', header: 'Due', render: (r) => <span className={r.dueAmount > 0 ? 'font-semibold text-red-600' : ''}>{formatCurrency(r.dueAmount)}</span> },
    { key: 'paymentStatus', header: 'Status', render: (r) => statusBadge(r.paymentStatus) },
    { key: 'paymentMethod', header: 'Method', render: (r) => r.paymentMethod ? getPaymentMethodLabel(r.paymentMethod) : '—' },
    { key: 'paymentDate', header: 'Date', render: (r) => r.paymentDate ? formatDate(r.paymentDate) : '—' },
  ];

  const incomeColumns: Column<IncomeEntry>[] = [
    { key: 'incomeDate', header: 'Date', render: (r) => formatDate(r.incomeDate) },
    { key: 'category', header: 'Category', render: (r) => getIncomeCategoryLabel(r.category) },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(r.amount)}</span> },
    { key: 'paymentMethod', header: 'Method', render: (r) => getPaymentMethodLabel(r.paymentMethod) },
    { key: 'receiptNumber', header: 'Receipt', render: (r) => r.receiptNumber || '—' },
    { key: 'notes', header: 'Notes', render: (r) => <span className="max-w-[200px] truncate block">{r.notes || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Tenant Ledger</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenant Ledger</h1>
        <p className="mt-1 text-sm text-slate-500">ভাড়াটিয়ার সম্পূর্ণ লেনদেনের ইতিহাস</p>
      </div>

      <div className="max-w-sm">
        <Select
          label="Select Tenant"
          placeholder="Choose a tenant..."
          options={tenants.map((t) => ({ value: t.id, label: `${t.name} — ${t.mobile}` }))}
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
      </div>

      {!tenantId && <EmptyState icon={<Users className="h-6 w-6" />} title="Select a tenant to view their ledger" />}

      {tenantId && isLoading && <LoadingSpinner />}

      {report && (
        <>
          {/* Actions */}
          <div className="flex justify-end" data-no-print>
            <PrintButton />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Rent</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(report.tenant.monthlyRent)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Security Deposit</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(report.tenant.securityDeposit)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Paid</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(report.summary.totalPaid)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Total Due</p>
              <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(report.summary.totalDue)}</p>
            </Card>
          </div>

          {/* Rent Payments Table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Rent Payment History</h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <Table
                columns={rentColumns}
                data={report.rentPayments as unknown as RentPayment[]}
                loading={isFetching}
                emptyMessage="No rent payments found"
                emptyIcon={<Home className="h-6 w-6" />}
                keyExtractor={(r) => r.id}
              />
            </div>
          </div>

          {/* Income Entries Table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Income Entries</h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <Table
                columns={incomeColumns}
                data={report.incomeEntries as unknown as IncomeEntry[]}
                loading={isFetching}
                emptyMessage="No income entries found"
                emptyIcon={<Wallet className="h-6 w-6" />}
                keyExtractor={(r) => r.id}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
