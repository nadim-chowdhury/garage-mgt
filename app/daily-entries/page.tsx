'use client';

import { useState } from 'react';
import {
  useGetDailyEntriesQuery,
  useCreateDailyEntryMutation,
  useUpdateDailyEntryMutation,
  useDeleteDailyEntryMutation,
} from '@/store/api/dailyEntryApi';
import {
  Button,
  Badge,
  Table,
  Pagination,
  DatePicker,
  Modal,
  Input,
  Select,
  Textarea,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { DailyVehicleEntry, CreateDailyEntryInput, UpdateDailyEntryInput } from '@/types';
import { formatCurrency, getVehicleTypeLabel, getPaymentMethodLabel } from '@/lib/utils';
import { Car, Pencil, Trash2, RotateCcw } from 'lucide-react';

const vehicleTypeOptions = [
  { value: 'car', label: 'Car' },
  { value: 'microbus', label: 'Microbus' },
  { value: 'bus', label: 'Bus' },
  { value: 'truck', label: 'Truck' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other' },
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

export default function DailyEntriesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyVehicleEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<DailyVehicleEntry | null>(null);

  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();

  const { data, isLoading } = useGetDailyEntriesQuery({
    page,
    limit: 20,
    date: date || undefined,
  });
  const [createEntry, { isLoading: isCreating }] = useCreateDailyEntryMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateDailyEntryMutation();
  const [deleteEntry, { isLoading: isDeleting }] = useDeleteDailyEntryMutation();

  const entries = (data?.data ?? []) as unknown as DailyVehicleEntry[];
  const meta = data?.meta;

  // New form state
  const [form, setForm] = useState<Partial<CreateDailyEntryInput>>({
    vehicleNumber: '',
    vehicleType: 'other',
    ownerName: '',
    ownerMobile: '',
    driverName: '',
    chargeAmount: 0,
    paidAmount: 0,
    paymentMethod: 'cash',
    notes: '',
    entryDate: today,
    entryTime: new Date().toTimeString().slice(0, 5),
  });

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<UpdateDailyEntryInput>>({});

  function handleOpenEdit(entry: DailyVehicleEntry) {
    setEditingEntry(entry);
    setEditForm({
      vehicleNumber: entry.vehicleNumber,
      vehicleType: entry.vehicleType,
      ownerName: entry.ownerName,
      ownerMobile: entry.ownerMobile,
      driverName: entry.driverName,
      chargeAmount: entry.chargeAmount,
      paidAmount: entry.paidAmount,
      paymentMethod: entry.paymentMethod,
      notes: entry.notes,
      entryDate: entry.entryDate,
      entryTime: entry.entryTime,
      exitTime: entry.exitTime,
    });
  }

  async function handleSubmit() {
    if (!form.vehicleNumber) return;
    try {
      await createEntry(form as CreateDailyEntryInput).unwrap();
      success('Entry saved successfully');
      setShowModal(false);
      setForm((prev) => ({
        ...prev,
        vehicleNumber: '',
        ownerName: '',
        ownerMobile: '',
        driverName: '',
        chargeAmount: 0,
        paidAmount: 0,
        notes: '',
      }));
    } catch {
      showError('Failed to save entry');
    }
  }

  async function handleUpdate() {
    if (!editingEntry || !editForm.vehicleNumber) return;
    try {
      await updateEntry({
        id: editingEntry.id,
        ...editForm,
      }).unwrap();
      success('Entry updated successfully');
      setEditingEntry(null);
    } catch {
      showError('Failed to update entry');
    }
  }

  async function handleDelete() {
    if (!entryToDelete) return;
    try {
      await deleteEntry(entryToDelete.id).unwrap();
      success('Entry deleted successfully');
      setEntryToDelete(null);
    } catch {
      showError('Failed to delete entry');
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      paid: 'success',
      partial: 'warning',
      unpaid: 'neutral',
      overdue: 'danger',
    };
    return <Badge variant={map[s] ?? 'neutral'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  const columns: Column<DailyVehicleEntry>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle No.',
      render: (r) => <span className="font-medium text-slate-900">{r.vehicleNumber}</span>,
    },
    {
      key: 'vehicleType',
      header: 'Type',
      hideOnMobile: true,
      render: (r) => getVehicleTypeLabel(r.vehicleType),
    },
    {
      key: 'ownerName',
      header: 'Owner',
      hideOnMobile: true,
      render: (r) => r.ownerName || '—',
    },
    {
      key: 'chargeAmount',
      header: 'Charge',
      render: (r) => formatCurrency(r.chargeAmount),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (r) => (
        <span className="font-medium text-emerald-600">{formatCurrency(r.paidAmount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      hideOnMobile: true,
      render: (r) => getPaymentMethodLabel(r.paymentMethod),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (r) => statusBadge(r.paymentStatus),
    },
    {
      key: 'entryTime',
      header: 'Time',
      hideOnMobile: true,
      render: (r) => r.entryTime?.slice(0, 5) ?? '—',
    },
    ...(canWrite
      ? [
          {
            key: 'actions' as keyof DailyVehicleEntry,
            header: 'Actions',
            render: (r: DailyVehicleEntry) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit entry"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEntryToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
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

      <div className="flex items-end gap-3">
        <div className="sm:w-52">
          <DatePicker
            label="Date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {date && (
          <div className="space-y-1.5">
            <span
              className="block text-sm font-medium text-transparent select-none pointer-events-none"
              aria-hidden="true"
            >
              &nbsp;
            </span>
            <button
              type="button"
              onClick={() => {
                setDate('');
                setPage(1);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-1.5 text-slate-400" />
              Show All
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={entries}
          loading={isLoading}
          emptyMessage={date ? 'No entries for this date' : 'No entries recorded yet'}
          emptyIcon={<Car className="h-6 w-6" />}
          keyExtractor={(r) => r.id}
        />
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {/* New Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Daily Vehicle Entry"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isCreating}>
              Save Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="vehicleNumber"
              label="Vehicle Number"
              required
              placeholder="e.g., DHAKA-1234"
              value={form.vehicleNumber}
              onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
            />
            <Select
              id="vehicleType"
              label="Vehicle Type"
              options={vehicleTypeOptions}
              value={form.vehicleType}
              onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value as DailyVehicleEntry['vehicleType'] }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="ownerName"
              label="Owner Name"
              placeholder="Optional"
              value={form.ownerName}
              onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
            />
            <Input
              id="ownerMobile"
              label="Owner Mobile"
              placeholder="01XXXXXXXXX"
              value={form.ownerMobile}
              onChange={(e) => setForm((p) => ({ ...p, ownerMobile: e.target.value }))}
            />
          </div>
          <Input
            id="driverName"
            label="Driver Name"
            placeholder="Optional"
            value={form.driverName}
            onChange={(e) => setForm((p) => ({ ...p, driverName: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              id="chargeAmount"
              label="Charge (৳)"
              type="number"
              min="0"
              value={form.chargeAmount}
              onChange={(e) => setForm((p) => ({ ...p, chargeAmount: Number(e.target.value) }))}
            />
            <Input
              id="paidAmount"
              label="Paid (৳)"
              type="number"
              min="0"
              value={form.paidAmount}
              onChange={(e) => setForm((p) => ({ ...p, paidAmount: Number(e.target.value) }))}
            />
            <Select
              id="paymentMethod"
              label="Payment Method"
              options={paymentMethodOptions}
              value={form.paymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as DailyVehicleEntry['paymentMethod'] }))}
            />
          </div>
          <Textarea
            id="notes"
            label="Notes"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        title="Edit Daily Vehicle Entry"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isUpdating}>
              Update Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit_vehicleNumber"
              label="Vehicle Number"
              required
              value={editForm.vehicleNumber ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
            />
            <Select
              id="edit_vehicleType"
              label="Vehicle Type"
              options={vehicleTypeOptions}
              value={editForm.vehicleType ?? 'other'}
              onChange={(e) => setEditForm((p) => ({ ...p, vehicleType: e.target.value as DailyVehicleEntry['vehicleType'] }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit_ownerName"
              label="Owner Name"
              value={editForm.ownerName ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, ownerName: e.target.value }))}
            />
            <Input
              id="edit_ownerMobile"
              label="Owner Mobile"
              value={editForm.ownerMobile ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, ownerMobile: e.target.value }))}
            />
          </div>
          <Input
            id="edit_driverName"
            label="Driver Name"
            value={editForm.driverName ?? ''}
            onChange={(e) => setEditForm((p) => ({ ...p, driverName: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              id="edit_chargeAmount"
              label="Charge (৳)"
              type="number"
              min="0"
              value={editForm.chargeAmount ?? 0}
              onChange={(e) => setEditForm((p) => ({ ...p, chargeAmount: Number(e.target.value) }))}
            />
            <Input
              id="edit_paidAmount"
              label="Paid (৳)"
              type="number"
              min="0"
              value={editForm.paidAmount ?? 0}
              onChange={(e) => setEditForm((p) => ({ ...p, paidAmount: Number(e.target.value) }))}
            />
            <Select
              id="edit_paymentMethod"
              label="Payment Method"
              options={paymentMethodOptions}
              value={editForm.paymentMethod ?? 'cash'}
              onChange={(e) => setEditForm((p) => ({ ...p, paymentMethod: e.target.value as DailyVehicleEntry['paymentMethod'] }))}
            />
          </div>
          <Textarea
            id="edit_notes"
            label="Notes"
            value={editForm.notes ?? ''}
            onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(entryToDelete)}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Daily Vehicle Entry"
        message={`Are you sure you want to delete the daily entry for ${entryToDelete?.vehicleNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
