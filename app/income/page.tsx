'use client';

import { useState } from 'react';
import { useGetIncomeEntriesQuery, useCreateIncomeMutation } from '@/store/api/incomeApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { Button, Badge, Table, Pagination, DatePicker, Modal, Input, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { IncomeEntry } from '@/types';
import { formatCurrency, formatDate, getIncomeCategoryLabel, getPaymentMethodLabel, generateReceiptNumber } from '@/lib/utils';
import { Wallet } from 'lucide-react';

const categoryOptions = [
  { value: 'monthly_rent', label: 'Monthly Rent' },
  { value: 'daily_vehicle_charge', label: 'Daily Vehicle Charge' },
  { value: 'security_deposit', label: 'Security Deposit' },
  { value: 'other', label: 'Other' },
];
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

interface IncomeRow extends IncomeEntry {
  tenantName?: string;
}

export default function IncomePage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { success, error: showError } = useToast();
  const { canWrite } = useAuth();

  const { data, isLoading } = useGetIncomeEntriesQuery({
    page, limit: 20, startDate, endDate,
    category: categoryFilter || undefined,
  });
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100 });
  const [createIncome, { isLoading: isCreating }] = useCreateIncomeMutation();

  const entries = (data?.data ?? []) as unknown as IncomeRow[];
  const meta = data?.meta;
  const tenants = tenantsRes?.data ?? [];

  const [form, setForm] = useState({
    tenantId: '', incomeDate: today, category: 'other', amount: '',
    paymentMethod: 'cash', receiptNumber: '', notes: '',
  });

  async function handleSubmit() {
    if (!form.amount || Number(form.amount) <= 0) return;
    try {
      await createIncome({
        tenantId: form.tenantId || null,
        vehicleId: null,
        dailyEntryId: null,
        incomeDate: form.incomeDate,
        category: form.category as IncomeEntry['category'],
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod as IncomeEntry['paymentMethod'],
        receiptNumber: form.receiptNumber || generateReceiptNumber(),
        notes: form.notes,
      }).unwrap();
      success('Income entry saved');
      setShowModal(false);
      setForm({ tenantId: '', incomeDate: today, category: 'other', amount: '', paymentMethod: 'cash', receiptNumber: '', notes: '' });
    } catch {
      showError('Failed to save income entry');
    }
  }

  const categoryBadge = (cat: string) => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
      monthly_rent: 'info', daily_vehicle_charge: 'success',
      security_deposit: 'warning', other: 'neutral',
    };
    return <Badge variant={map[cat] ?? 'neutral'}>{getIncomeCategoryLabel(cat as IncomeEntry['category'])}</Badge>;
  };

  const columns: Column<IncomeRow>[] = [
    { key: 'incomeDate', header: 'Date', render: (r) => formatDate(r.incomeDate) },
    { key: 'category', header: 'Category', render: (r) => categoryBadge(r.category) },
    { key: 'tenantName', header: 'Tenant', hideOnMobile: true, render: (r) => r.tenantName || '—' },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(r.amount)}</span> },
    { key: 'paymentMethod', header: 'Method', hideOnMobile: true, render: (r) => getPaymentMethodLabel(r.paymentMethod) },
    { key: 'receiptNumber', header: 'Receipt', hideOnMobile: true, render: (r) => r.receiptNumber || '—' },
    { key: 'notes', header: 'Notes', hideOnMobile: true, render: (r) => <span className="max-w-[200px] truncate block">{r.notes || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Income</h1>
          <p className="mt-1 text-sm text-slate-500">আয়ের হিসাব</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ Add Income</Button>}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40"><DatePicker label="From" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} /></div>
        <div className="w-40"><DatePicker label="To" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} /></div>
        <div className="w-48"><Select label="Category" placeholder="All Categories" options={[{ value: '', label: 'All' }, ...categoryOptions]} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} /></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} data={entries} loading={isLoading} emptyMessage="No income entries found" emptyIcon={<Wallet className="h-6 w-6" />} keyExtractor={(r) => r.id} />
      </div>

      {meta && meta.totalPages > 1 && <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Income Entry" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSubmit} loading={isCreating}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker id="incomeDate" label="Date" required value={form.incomeDate} onChange={(e) => setForm((p) => ({ ...p, incomeDate: e.target.value }))} />
            <Select id="category" label="Category" required options={categoryOptions} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          </div>
          <Select id="tenantId" label="Tenant (optional)" placeholder="Select tenant..." options={[{ value: '', label: 'None' }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]} value={form.tenantId} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="amount" label="Amount (৳)" type="number" min="0" required placeholder="0.00" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            <Select id="paymentMethod" label="Payment Method" options={paymentMethodOptions} value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))} />
          </div>
          <Input id="receiptNumber" label="Receipt Number" placeholder="Auto-generated if empty" value={form.receiptNumber} onChange={(e) => setForm((p) => ({ ...p, receiptNumber: e.target.value }))} />
          <Textarea id="notes" label="Notes" placeholder="Optional" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

