'use client';

import { useState } from 'react';
import {
  useGetExpenseEntriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from '@/store/api/expenseApi';
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
import type { ExpenseEntry } from '@/types';
import { formatCurrency, formatDate, getExpenseCategoryLabel, getPaymentMethodLabel } from '@/lib/utils';
import { CreditCard, Pencil, Trash2 } from 'lucide-react';

const categoryOptions = [
  { value: 'electricity', label: 'Electricity Bill' },
  { value: 'water', label: 'Water Bill' },
  { value: 'repair_maintenance', label: 'Repair & Maintenance' },
  { value: 'salary', label: 'Salary' },
  { value: 'other', label: 'Other' },
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

export default function ExpensesPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseEntry | null>(null);

  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();

  const { data, isLoading } = useGetExpenseEntriesQuery({
    page,
    limit: 20,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    category: categoryFilter || undefined,
  });
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const entries = (data?.data ?? []) as unknown as ExpenseEntry[];
  const meta = data?.meta;

  const [form, setForm] = useState({
    expenseDate: today,
    category: 'other',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    expenseDate: today,
    category: 'other',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    notes: '',
  });

  function handleOpenEdit(entry: ExpenseEntry) {
    setEditingExpense(entry);
    setEditForm({
      expenseDate: entry.expenseDate,
      category: entry.category,
      description: entry.description || '',
      amount: String(entry.amount),
      paymentMethod: entry.paymentMethod,
      receiptNumber: entry.receiptNumber || '',
      notes: entry.notes || '',
    });
  }

  async function handleSubmit() {
    if (!form.amount || Number(form.amount) <= 0) return;
    try {
      await createExpense({
        expenseDate: form.expenseDate,
        category: form.category as ExpenseEntry['category'],
        description: form.description,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod as ExpenseEntry['paymentMethod'],
        receiptNumber: form.receiptNumber,
        notes: form.notes,
      }).unwrap();
      success('Expense saved');
      setShowModal(false);
      setForm({
        expenseDate: today,
        category: 'other',
        description: '',
        amount: '',
        paymentMethod: 'cash',
        receiptNumber: '',
        notes: '',
      });
    } catch {
      showError('Failed to save expense');
    }
  }

  async function handleUpdate() {
    if (!editingExpense || !editForm.amount) return;
    try {
      await updateExpense({
        id: editingExpense.id,
        expenseDate: editForm.expenseDate,
        category: editForm.category as ExpenseEntry['category'],
        description: editForm.description,
        amount: Number(editForm.amount),
        paymentMethod: editForm.paymentMethod as ExpenseEntry['paymentMethod'],
        receiptNumber: editForm.receiptNumber,
        notes: editForm.notes,
      }).unwrap();
      success('Expense updated');
      setEditingExpense(null);
    } catch {
      showError('Failed to update expense');
    }
  }

  async function handleDelete() {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id).unwrap();
      success('Expense deleted');
      setExpenseToDelete(null);
    } catch {
      showError('Failed to delete expense');
    }
  }

  const categoryBadge = (cat: string) => {
    const map: Record<string, 'danger' | 'info' | 'warning' | 'neutral'> = {
      electricity: 'warning',
      water: 'info',
      repair_maintenance: 'danger',
      salary: 'neutral',
      other: 'neutral',
    };
    return (
      <Badge variant={map[cat] ?? 'neutral'}>
        {getExpenseCategoryLabel(cat as ExpenseEntry['category'])}
      </Badge>
    );
  };

  const columns: Column<ExpenseEntry>[] = [
    { key: 'expenseDate', header: 'Date', render: (r) => formatDate(r.expenseDate) },
    { key: 'category', header: 'Category', render: (r) => categoryBadge(r.category) },
    { key: 'description', header: 'Description', hideOnMobile: true, render: (r) => r.description || '—' },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => <span className="font-semibold text-red-600">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      hideOnMobile: true,
      render: (r) => getPaymentMethodLabel(r.paymentMethod),
    },
    {
      key: 'notes',
      header: 'Notes',
      hideOnMobile: true,
      render: (r) => <span className="max-w-[200px] truncate block">{r.notes || '—'}</span>,
    },
    ...(canWrite
      ? [
          {
            key: 'actions' as keyof ExpenseEntry,
            header: 'Actions',
            render: (r: ExpenseEntry) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit expense"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setExpenseToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete expense"
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
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">খরচের হিসাব</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ Add Expense</Button>}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40">
          <DatePicker
            label="From"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <DatePicker
            label="To"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            label="Category"
            options={[{ value: '', label: 'All' }, ...categoryOptions]}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(startDate || endDate || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setCategoryFilter('');
              setPage(1);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 mb-1"
          >
            Show All
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={entries}
          loading={isLoading}
          emptyMessage="No expense entries found"
          emptyIcon={<CreditCard className="h-6 w-6" />}
          keyExtractor={(r) => r.id}
        />
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Expense"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isCreating}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              id="expenseDate"
              label="Date"
              required
              value={form.expenseDate}
              onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
            />
            <Select
              id="category"
              label="Category"
              required
              options={categoryOptions}
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            />
          </div>
          <Input
            id="description"
            label="Description"
            placeholder="What was this expense for?"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="amount"
              label="Amount (৳)"
              type="number"
              min="0"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <Select
              id="paymentMethod"
              label="Payment Method"
              options={paymentMethodOptions}
              value={form.paymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            />
          </div>
          <Textarea
            id="notes"
            label="Notes"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isUpdating}>
              Update Expense
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              id="edit_expenseDate"
              label="Date"
              required
              value={editForm.expenseDate}
              onChange={(e) => setEditForm((p) => ({ ...p, expenseDate: e.target.value }))}
            />
            <Select
              id="edit_category"
              label="Category"
              required
              options={categoryOptions}
              value={editForm.category}
              onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
            />
          </div>
          <Input
            id="edit_description"
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit_amount"
              label="Amount (৳)"
              type="number"
              min="0"
              required
              value={editForm.amount}
              onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <Select
              id="edit_paymentMethod"
              label="Payment Method"
              options={paymentMethodOptions}
              value={editForm.paymentMethod}
              onChange={(e) => setEditForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            />
          </div>
          <Textarea
            id="edit_notes"
            label="Notes"
            value={editForm.notes}
            onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense entry of ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
