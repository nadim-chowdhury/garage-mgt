'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetIncomeExpenseSummaryQuery } from '@/store/api/reportApi';
import { Card, DatePicker, Table, LoadingSpinner, EmptyState, Button, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import { formatCurrency, getIncomeCategoryLabel, getExpenseCategoryLabel } from '@/lib/utils';
import { generateCsv, downloadCsv } from '@/lib/csv';
import type { IncomeCategory, ExpenseCategory } from '@/types';
import { Wallet, CreditCard, PieChart } from 'lucide-react';

interface CategoryRow {
  category: string;
  total: number;
  count: number;
}

export default function IncomeExpenseSummaryPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useGetIncomeExpenseSummaryQuery({ startDate, endDate });
  const report = data?.data;

  const incomeColumns: Column<CategoryRow>[] = [
    { key: 'category', header: 'Category', render: (r) => getIncomeCategoryLabel(r.category as IncomeCategory) },
    { key: 'count', header: 'Count', render: (r) => r.count },
    { key: 'total', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(Number(r.total))}</span> },
  ];

  const expenseColumns: Column<CategoryRow>[] = [
    { key: 'category', header: 'Category', render: (r) => getExpenseCategoryLabel(r.category as ExpenseCategory) },
    { key: 'count', header: 'Count', render: (r) => r.count },
    { key: 'total', header: 'Amount', render: (r) => <span className="font-semibold text-red-600">{formatCurrency(Number(r.total))}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Income & Expense Summary</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Income & Expense Summary</h1>
        <p className="mt-1 text-sm text-slate-500">মোট আয় ও খরচের তুলনা</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40"><DatePicker label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="w-40"><DatePicker label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      {isLoading && <LoadingSpinner />}

      {report && (
        <>
          {/* Actions */}
          <div className="flex gap-2 justify-end" data-no-print>
            <Button variant="secondary" size="sm" onClick={() => {
              const incomeRows = (report.incomeByCategory as unknown as CategoryRow[]).map(r => ({ type: 'Income', category: getIncomeCategoryLabel(r.category as IncomeCategory), count: r.count, total: Number(r.total) }));
              const expenseRows = (report.expenseByCategory as unknown as CategoryRow[]).map(r => ({ type: 'Expense', category: getExpenseCategoryLabel(r.category as ExpenseCategory), count: r.count, total: Number(r.total) }));
              const csv = generateCsv([...incomeRows, ...expenseRows], [
                { header: 'Type', accessor: (r) => r.type },
                { header: 'Category', accessor: (r) => r.category },
                { header: 'Count', accessor: (r) => r.count },
                { header: 'Amount', accessor: (r) => r.total },
              ]);
              downloadCsv(csv, `income-expense-summary-${startDate}-to-${endDate}`);
            }}>📥 Export CSV</Button>
            <PrintButton />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Income</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(report.totalIncome)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Total Expense</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(report.totalExpense)}</p>
            </Card>
            <Card>
              <p className={`text-xs font-medium uppercase tracking-wider ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Net {report.netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className={`mt-1 text-2xl font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(report.netProfit))}
              </p>
            </Card>
          </div>

          {/* Side-by-side Tables */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Income by Category</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table
                  columns={incomeColumns}
                  data={report.incomeByCategory as unknown as CategoryRow[]}
                  emptyMessage="No income in this period"
                  emptyIcon={<Wallet className="h-6 w-6" />}
                  keyExtractor={(r) => r.category}
                />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Expense by Category</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table
                  columns={expenseColumns}
                  data={report.expenseByCategory as unknown as CategoryRow[]}
                  emptyMessage="No expenses in this period"
                  emptyIcon={<CreditCard className="h-6 w-6" />}
                  keyExtractor={(r) => r.category}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!isLoading && !report && <EmptyState icon={<PieChart className="h-6 w-6" />} title="No data available for the selected period" />}
    </div>
  );
}
