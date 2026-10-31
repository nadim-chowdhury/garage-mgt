'use client';

import { useState } from 'react';
import { useGetCashBookQuery } from '@/store/api/dashboardApi';
import { Card, StatCard, DatePicker, Table, LoadingSpinner } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import { formatCurrency, formatDate, getIncomeCategoryLabel, getExpenseCategoryLabel } from '@/lib/utils';
import type { IncomeEntry, ExpenseEntry } from '@/types';
import { Wallet, CreditCard, FolderOpen, PieChart } from 'lucide-react';

export default function CashBookPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const { data, isLoading } = useGetCashBookQuery(date);
  const cashBook = data?.data;

  const incomeColumns: Column<IncomeEntry>[] = [
    { key: 'category', header: 'Category', render: (r) => getIncomeCategoryLabel(r.category) },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-medium text-emerald-600">{formatCurrency(r.amount)}</span> },
    { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
  ];

  const expenseColumns: Column<ExpenseEntry>[] = [
    { key: 'category', header: 'Category', render: (r) => getExpenseCategoryLabel(r.category) },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-medium text-red-600">{formatCurrency(r.amount)}</span> },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Book</h1>
          <p className="mt-1 text-sm text-slate-500">দৈনিক নগদ হিসাব — {formatDate(date)}</p>
        </div>
        <div className="w-48"><DatePicker value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Opening Balance" value={formatCurrency(cashBook?.openingBalance ?? 0)} icon={<FolderOpen className="h-5 w-5" />} color="neutral" />
        <StatCard title="Total Income" value={formatCurrency(cashBook?.totalIncome ?? 0)} icon={<Wallet className="h-5 w-5" />} color="success" />
        <StatCard title="Total Expense" value={formatCurrency(cashBook?.totalExpense ?? 0)} icon={<CreditCard className="h-5 w-5" />} color="danger" />
        <StatCard title="Closing Balance" value={formatCurrency(cashBook?.closingBalance ?? 0)} icon={<PieChart className="h-5 w-5" />}
          color={(cashBook?.closingBalance ?? 0) >= 0 ? 'primary' : 'danger'} />
      </div>

      {/* Income & Expense breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Income Entries" noPadding>
          <Table
            columns={incomeColumns}
            data={(cashBook?.incomeEntries ?? []) as unknown as IncomeEntry[]}
            emptyMessage="No income today"
            emptyIcon={<Wallet className="h-6 w-6" />}
            keyExtractor={(r) => r.id}
          />
        </Card>

        <Card title="Expense Entries" noPadding>
          <Table
            columns={expenseColumns}
            data={(cashBook?.expenseEntries ?? []) as unknown as ExpenseEntry[]}
            emptyMessage="No expenses today"
            emptyIcon={<CreditCard className="h-6 w-6" />}
            keyExtractor={(r) => r.id}
          />
        </Card>
      </div>
    </div>
  );
}

