'use client';

import { useState } from 'react';
import { useGetDailyEntriesQuery, useCreateDailyEntryMutation } from '@/store/api/dailyEntryApi';
import { Button, Badge, Table, Pagination, DatePicker, Modal, Input, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { DailyVehicleEntry, CreateDailyEntryInput } from '@/types';
import { formatCurrency, getVehicleTypeLabel, getPaymentMethodLabel } from '@/lib/utils';
import { Car } from 'lucide-react';

const vehicleTypeOptions = [
  { value: 'car', label: 'Car' }, { value: 'microbus', label: 'Microbus' },
  { value: 'bus', label: 'Bus' }, { value: 'truck', label: 'Truck' },
  { value: 'pickup', label: 'Pickup' }, { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { value: 'motorcycle', label: 'Motorcycle' }, { value: 'other', label: 'Other' },
];
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

export default function DailyEntriesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const { success, error: showError } = useToast();
  const { canWrite } = useAuth();

  const { data, isLoading } = useGetDailyEntriesQuery({ page, limit: 20, date });
  const [createEntry, { isLoading: isCreating }] = useCreateDailyEntryMutation();

  const entries = (data?.data ?? []) as unknown as DailyVehicleEntry[];
  const meta = data?.meta;

  // Quick form state
  const [form, setForm] = useState<Partial<CreateDailyEntryInput>>({
    vehicleNumber: '', vehicleType: 'other', ownerName: '', ownerMobile: '',
    driverName: '', chargeAmount: 0, paidAmount: 0, paymentMethod: 'cash',
    notes: '', entryDate: today, entryTime: new Date().toTimeString().slice(0, 5),
  });

  async function handleSubmit() {
    if (!form.vehicleNumber) return;
    try {
      await createEntry(form as CreateDailyEntryInput).unwrap();
      success('Entry saved successfully');
      setShowModal(false);
      setForm((prev) => ({ ...prev, vehicleNumber: '', ownerName: '', ownerMobile: '', driverName: '', chargeAmount: 0, paidAmount: 0, notes: '' }));
    } catch {
      showError('Failed to save entry');
    }
  }

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      paid: 'success', partial: 'warning', unpaid: 'neutral', overdue: 'danger',
    };
    return <Badge variant={map[s] ?? 'neutral'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  const columns: Column<DailyVehicleEntry>[] = [
    { key: 'vehicleNumber', header: 'Vehicle No.', render: (r) => <span className="font-medium">{r.vehicleNumber}</span> },
    { key: 'vehicleType', header: 'Type', render: (r) => getVehicleTypeLabel(r.vehicleType) },
    { key: 'ownerName', header: 'Owner', render: (r) => r.ownerName || '—' },
    { key: 'chargeAmount', header: 'Charge', render: (r) => formatCurrency(r.chargeAmount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => <span className="font-medium text-emerald-600">{formatCurrency(r.paidAmount)}</span> },
    { key: 'paymentMethod', header: 'Method', render: (r) => getPaymentMethodLabel(r.paymentMethod) },
    { key: 'paymentStatus', header: 'Status', render: (r) => statusBadge(r.paymentStatus) },
    { key: 'entryTime', header: 'Time', render: (r) => r.entryTime?.slice(0, 5) ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Vehicle Entries</h1>
          <p className="mt-1 text-sm text-slate-500">দৈনিক গাড়ি জমার হিসাব</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ New Entry</Button>}
      </div>

      <div className="sm:w-48">
        <DatePicker label="Date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} data={entries} loading={isLoading} emptyMessage="No entries for this date" emptyIcon={<Car className="h-6 w-6" />} keyExtractor={(r) => r.id} />
      </div>

      {meta && meta.totalPages > 1 && <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}

      {/* New Entry Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Daily Vehicle Entry" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSubmit} loading={isCreating}>Save Entry</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="vehicleNumber" label="Vehicle Number" required placeholder="e.g., DHAKA-1234" value={form.vehicleNumber} onChange={(e) => updateForm('vehicleNumber', e.target.value)} />
            <Select id="vehicleType" label="Vehicle Type" options={vehicleTypeOptions} value={form.vehicleType} onChange={(e) => updateForm('vehicleType', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="ownerName" label="Owner Name" placeholder="Optional" value={form.ownerName} onChange={(e) => updateForm('ownerName', e.target.value)} />
            <Input id="ownerMobile" label="Owner Mobile" placeholder="01XXXXXXXXX" value={form.ownerMobile} onChange={(e) => updateForm('ownerMobile', e.target.value)} />
          </div>
          <Input id="driverName" label="Driver Name" placeholder="Optional" value={form.driverName} onChange={(e) => updateForm('driverName', e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input id="chargeAmount" label="Charge (৳)" type="number" min="0" value={form.chargeAmount} onChange={(e) => updateForm('chargeAmount', Number(e.target.value))} />
            <Input id="paidAmount" label="Paid (৳)" type="number" min="0" value={form.paidAmount} onChange={(e) => updateForm('paidAmount', Number(e.target.value))} />
            <Select id="paymentMethod" label="Payment Method" options={paymentMethodOptions} value={form.paymentMethod} onChange={(e) => updateForm('paymentMethod', e.target.value)} />
          </div>
          <Textarea id="notes" label="Notes" placeholder="Optional notes" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

