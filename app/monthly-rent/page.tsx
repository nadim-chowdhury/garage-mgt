'use client';

import { useState } from 'react';
import { useGetRentPaymentsQuery, useCreateRentPaymentMutation } from '@/store/api/rentPaymentApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { Button, Badge, Table, Pagination, Select, Modal, Input, FilterPills } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { RentPayment } from '@/types';
import { formatCurrency, getPaymentMethodLabel } from '@/lib/utils';
import { Home } from 'lucide-react';

const monthOptions = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

interface RentRow extends RentPayment {
  tenantName?: string;
  tenantMobile?: string;
}

export default function MonthlyRentPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { success, error: showError } = useToast();
  const { canWrite } = useAuth();

  const { data, isLoading } = useGetRentPaymentsQuery({
    page, limit: 20,
    month: filterMonth, year: filterYear,
    status: statusFilter || undefined,
  });
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100, status: 'active' });
  const [createPayment, { isLoading: isCreating }] = useCreateRentPaymentMutation();

  const payments = (data?.data ?? []) as unknown as RentRow[];
  const meta = data?.meta;
  const tenants = tenantsRes?.data ?? [];

  const [form, setForm] = useState({
    tenantId: '', paidAmount: '', paymentMethod: 'cash' as 'cash' | 'bank' | 'mobile_banking', notes: '',
  });

  async function handleSubmit() {
    if (!form.tenantId || !form.paidAmount) return;
    try {
      const tenant = tenants.find((t) => t.id === form.tenantId);
      await createPayment({
        tenantId: form.tenantId,
        rentMonth: Number(filterMonth),
        rentYear: Number(filterYear),
        rentAmount: tenant?.monthlyRent ?? 0,
        paidAmount: Number(form.paidAmount),
        dueAmount: Math.max(0, (tenant?.monthlyRent ?? 0) - Number(form.paidAmount)),
        paymentMethod: form.paymentMethod,
        paymentStatus: 'unpaid', // server calculates
        paymentDate: null,
        dueDate: `${filterYear}-${filterMonth.padStart(2, '0')}-${String(tenant?.rentDueDay ?? 1).padStart(2, '0')}`,
        receiptNumber: '',
        notes: form.notes,
      }).unwrap();
      success('Payment recorded successfully');
      setShowModal(false);
      setForm({ tenantId: '', paidAmount: '', paymentMethod: 'cash', notes: '' });
    } catch {
      showError('Failed to record payment');
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      paid: 'success', partial: 'warning', unpaid: 'neutral', overdue: 'danger',
    };
    return <Badge variant={map[s] ?? 'neutral'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  const yearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = String(now.getFullYear() - 3 + i);
    return { value: y, label: y };
  });

  const columns: Column<RentRow>[] = [
    { key: 'tenantName', header: 'Tenant', render: (r) => (
      <div><p className="font-medium text-slate-900">{r.tenantName}</p><p className="text-xs text-slate-400">{r.tenantMobile}</p></div>
    )},
    { key: 'rentAmount', header: 'Rent', hideOnMobile: true, render: (r) => formatCurrency(r.rentAmount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => <span className="font-medium text-emerald-600">{formatCurrency(r.paidAmount)}</span> },
    { key: 'dueAmount', header: 'Due', render: (r) => r.dueAmount > 0 ? <span className="font-medium text-red-600">{formatCurrency(r.dueAmount)}</span> : '—' },
    { key: 'paymentMethod', header: 'Method', hideOnMobile: true, render: (r) => getPaymentMethodLabel(r.paymentMethod) },
    { key: 'paymentStatus', header: 'Status', render: (r) => statusBadge(r.paymentStatus) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Rent</h1>
          <p className="mt-1 text-sm text-slate-500">মাসিক গ্যারেজ ভাড়ার হিসাব</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ Record Payment</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><Select label="Month" options={monthOptions} value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }} /></div>
        <div className="w-28"><Select label="Year" options={yearOptions} value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} /></div>
        <FilterPills
          label="Status"
          options={[
            { value: '', label: 'All' },
            { value: 'paid', label: 'Paid' },
            { value: 'partial', label: 'Partial' },
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'overdue', label: 'Overdue' },
          ]}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} data={payments} loading={isLoading} emptyMessage="No rent records for this period" emptyIcon={<Home className="h-6 w-6" />} keyExtractor={(r) => r.id} />
      </div>

      {meta && meta.totalPages > 1 && <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}

      {/* Payment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Rent Payment" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSubmit} loading={isCreating}>Record Payment</Button></>}>
        <div className="space-y-4">
          <Select id="tenantId" label="Tenant" required placeholder="Select tenant..." options={tenants.map((t) => ({ value: t.id, label: `${t.name} — ${formatCurrency(t.monthlyRent)}/mo` }))} value={form.tenantId} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))} />
          <Input id="paidAmount" label="Paid Amount (৳)" type="number" min="0" required placeholder="Enter amount paid" value={form.paidAmount} onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))} />
          <Select id="paymentMethod" label="Payment Method" options={paymentMethodOptions} value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as 'cash' | 'bank' | 'mobile_banking' }))} />
          <Input id="notes" label="Notes" placeholder="Optional" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

