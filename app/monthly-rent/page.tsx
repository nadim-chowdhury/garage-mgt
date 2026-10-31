'use client';

import { useState } from 'react';
import {
  useGetRentPaymentsQuery,
  useCreateRentPaymentMutation,
  useUpdateRentPaymentMutation,
  useDeleteRentPaymentMutation,
} from '@/store/api/rentPaymentApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import {
  Button,
  Badge,
  Table,
  Pagination,
  Select,
  Modal,
  Input,
  FilterPills,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { RentPayment } from '@/types';
import { formatCurrency, getPaymentMethodLabel } from '@/lib/utils';
import { Home, Pencil, Trash2 } from 'lucide-react';

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
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
  const [editingPayment, setEditingPayment] = useState<RentRow | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<RentRow | null>(null);

  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();

  const { data, isLoading } = useGetRentPaymentsQuery({
    page,
    limit: 20,
    month: filterMonth || undefined,
    year: filterYear || undefined,
    status: statusFilter || undefined,
  });
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100 });
  const [createPayment, { isLoading: isCreating }] = useCreateRentPaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdateRentPaymentMutation();
  const [deletePayment, { isLoading: isDeleting }] = useDeleteRentPaymentMutation();

  const payments = (data?.data ?? []) as unknown as RentRow[];
  const meta = data?.meta;
  const tenants = tenantsRes?.data ?? [];

  // Create form state
  const [form, setForm] = useState({
    tenantId: '',
    paidAmount: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'mobile_banking',
    notes: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    paidAmount: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'mobile_banking',
    notes: '',
  });

  function handleOpenEdit(payment: RentRow) {
    setEditingPayment(payment);
    setEditForm({
      paidAmount: String(payment.paidAmount),
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || '',
    });
  }

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
        paymentStatus: 'unpaid',
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

  async function handleUpdate() {
    if (!editingPayment) return;
    try {
      await updatePayment({
        id: editingPayment.id,
        paidAmount: Number(editForm.paidAmount) || 0,
        paymentMethod: editForm.paymentMethod,
        notes: editForm.notes,
      }).unwrap();
      success('Payment updated successfully');
      setEditingPayment(null);
    } catch {
      showError('Failed to update payment');
    }
  }

  async function handleDelete() {
    if (!paymentToDelete) return;
    try {
      await deletePayment(paymentToDelete.id).unwrap();
      success('Payment deleted successfully');
      setPaymentToDelete(null);
    } catch {
      showError('Failed to delete payment');
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

  const yearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = String(now.getFullYear() - 3 + i);
    return { value: y, label: y };
  });

  const columns: Column<RentRow>[] = [
    {
      key: 'tenantName',
      header: 'Tenant',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.tenantName}</p>
          <p className="text-xs text-slate-400">{r.tenantMobile}</p>
        </div>
      ),
    },
    {
      key: 'rentAmount',
      header: 'Rent',
      hideOnMobile: true,
      render: (r) => formatCurrency(r.rentAmount),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (r) => (
        <span className="font-medium text-emerald-600">{formatCurrency(r.paidAmount)}</span>
      ),
    },
    {
      key: 'dueAmount',
      header: 'Due',
      render: (r) =>
        r.dueAmount > 0 ? (
          <span className="font-medium text-red-600">{formatCurrency(r.dueAmount)}</span>
        ) : (
          '—'
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
    ...(canWrite
      ? [
          {
            key: 'actions' as keyof RentRow,
            header: 'Actions',
            render: (r: RentRow) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit payment"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPaymentToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete payment"
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
          <h1 className="text-2xl font-bold text-slate-900">Monthly Rent</h1>
          <p className="mt-1 text-sm text-slate-500">মাসিক গ্যারেজ ভাড়ার হিসাব</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ Record Payment</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Month"
            options={[{ value: '', label: 'All Months' }, ...monthOptions]}
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-28">
          <Select
            label="Year"
            options={yearOptions}
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={payments}
          loading={isLoading}
          emptyMessage="No rent records for this period"
          emptyIcon={<Home className="h-6 w-6" />}
          keyExtractor={(r) => r.id}
        />
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Rent Payment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isCreating}>
              Record Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="tenantId"
            label="Tenant"
            required
            placeholder="Select tenant..."
            options={tenants.map((t) => ({
              value: t.id,
              label: `${t.name}${t.status === 'inactive' ? ' (Inactive)' : ''} — ${formatCurrency(Number(t.monthlyRent) || 0)}/mo`,
            }))}
            value={form.tenantId}
            onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}
          />
          <Input
            id="paidAmount"
            label="Paid Amount (৳)"
            type="number"
            min="0"
            required
            placeholder="Enter amount paid"
            value={form.paidAmount}
            onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
          />
          <Select
            id="paymentMethod"
            label="Payment Method"
            options={paymentMethodOptions}
            value={form.paymentMethod}
            onChange={(e) =>
              setForm((p) => ({ ...p, paymentMethod: e.target.value as 'cash' | 'bank' | 'mobile_banking' }))
            }
          />
          <Input
            id="notes"
            label="Notes"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        title={`Edit Payment — ${editingPayment?.tenantName ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isUpdating}>
              Update Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Rent for Period</p>
            <p className="font-semibold text-slate-800">
              {editingPayment ? `${monthOptions.find((m) => m.value === String(editingPayment.rentMonth))?.label} ${editingPayment.rentYear} — ${formatCurrency(editingPayment.rentAmount)}` : ''}
            </p>
          </div>
          <Input
            id="edit_paidAmount"
            label="Paid Amount (৳)"
            type="number"
            min="0"
            required
            value={editForm.paidAmount}
            onChange={(e) => setEditForm((p) => ({ ...p, paidAmount: e.target.value }))}
          />
          <Select
            id="edit_paymentMethod"
            label="Payment Method"
            options={paymentMethodOptions}
            value={editForm.paymentMethod}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, paymentMethod: e.target.value as 'cash' | 'bank' | 'mobile_banking' }))
            }
          />
          <Input
            id="edit_notes"
            label="Notes"
            placeholder="Optional"
            value={editForm.notes}
            onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Rent Payment"
        message={`Are you sure you want to delete the rent payment for ${paymentToDelete?.tenantName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
