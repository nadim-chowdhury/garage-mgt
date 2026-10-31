'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetPaymentHistoryQuery } from '@/store/api/reportApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { Card, Select, DatePicker, Table, LoadingSpinner, EmptyState, Button, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import type { IncomeEntry } from '@/types';
import { formatCurrency, formatDate, getIncomeCategoryLabel, getPaymentMethodLabel } from '@/lib/utils';
import { generateCsv, downloadCsv } from '@/lib/csv';
import { CreditCard } from 'lucide-react';

interface PaymentRow extends IncomeEntry {
  tenantName: string | null;
  tenantMobile: string | null;
}

export default function PaymentHistoryPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [tenantId, setTenantId] = useState('');

  const { data: tenantsRes } = useGetTenantsQuery({ limit: 200 });
  const { data, isLoading } = useGetPaymentHistoryQuery({
    startDate, endDate, tenantId: tenantId || undefined,
  });

  const tenants = tenantsRes?.data ?? [];
  const report = data?.data;

  const columns: Column<PaymentRow>[] = [
    { key: 'incomeDate', header: 'Date', render: (r) => formatDate(r.incomeDate) },
    { key: 'tenantName', header: 'Tenant', render: (r) => r.tenantName || '—' },
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
        <span className="text-slate-900 font-medium">Payment History</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="mt-1 text-sm text-slate-500">কে কখন কত টাকা দিয়েছেন</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40"><DatePicker label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="w-40"><DatePicker label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <div className="w-56">
          <Select
            label="Tenant (optional)"
            placeholder="All Tenants"
            options={[{ value: '', label: 'All Tenants' }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]}
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {report && (
        <>
          {/* Actions */}
          <div className="flex gap-2 justify-end" data-no-print>
            <Button variant="secondary" size="sm" onClick={() => {
              const csv = generateCsv(report.payments as unknown as PaymentRow[], [
                { header: 'Date', accessor: (r) => formatDate(r.incomeDate) },
                { header: 'Tenant', accessor: (r) => r.tenantName ?? '' },
                { header: 'Category', accessor: (r) => getIncomeCategoryLabel(r.category) },
                { header: 'Amount', accessor: (r) => r.amount },
                { header: 'Method', accessor: (r) => getPaymentMethodLabel(r.paymentMethod) },
                { header: 'Receipt', accessor: (r) => r.receiptNumber ?? '' },
              ]);
              downloadCsv(csv, `payment-history-${startDate}-to-${endDate}`);
            }}>📥 Export CSV</Button>
            <PrintButton />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Collected</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(report.totalAmount)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Entries</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{report.totalCount}</p>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table
              columns={columns}
              data={report.payments as unknown as PaymentRow[]}
              emptyMessage="No payments found for the selected period"
              emptyIcon={<CreditCard className="h-6 w-6" />}
              keyExtractor={(r) => r.id}
            />
          </div>
        </>
      )}

      {!isLoading && !report && <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No data available" />}
    </div>
  );
}
