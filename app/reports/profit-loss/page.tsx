'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetProfitLossQuery } from '@/store/api/reportApi';
import { Card, DatePicker, Table, LoadingSpinner, EmptyState, Button, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import { formatCurrency } from '@/lib/utils';
import { generateCsv, downloadCsv } from '@/lib/csv';
import { TrendingUp, Download } from 'lucide-react';

interface MonthRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  return `${MONTH_NAMES[parseInt(month, 10)] ?? month} ${year}`;
}

export default function ProfitLossPage() {
  const today = new Date().toISOString().split('T')[0];
  const yearStart = today.slice(0, 4) + '-01-01';
  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useGetProfitLossQuery({ startDate, endDate });
  const report = data?.data;

  const columns: Column<MonthRow>[] = [
    { key: 'month', header: 'Month', render: (r) => formatMonthLabel(r.month) },
    { key: 'income', header: 'Income', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(Number(r.income))}</span> },
    { key: 'expense', header: 'Expense', render: (r) => <span className="font-semibold text-red-600">{formatCurrency(Number(r.expense))}</span> },
    {
      key: 'net', header: 'Net',
      render: (r) => {
        const net = Number(r.net);
        return <span className={`font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}{formatCurrency(net)}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Profit & Loss</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profit & Loss Report</h1>
        <p className="mt-1 text-sm text-slate-500">নির্দিষ্ট সময়ের আয় ও ব্যয়ের ভিত্তিতে উদ্বৃত্ত বা ঘাটতি</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40"><DatePicker label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="w-40"><DatePicker label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        {report && (
          <div className="flex gap-2 ml-auto" data-no-print>
            <Button variant="secondary" size="sm" onClick={() => {
              const csv = generateCsv(report.monthlyBreakdown as unknown as MonthRow[], [
                { header: 'Month', accessor: (r) => formatMonthLabel(r.month) },
                { header: 'Income', accessor: (r) => Number(r.income) },
                { header: 'Expense', accessor: (r) => Number(r.expense) },
                { header: 'Net', accessor: (r) => Number(r.net) },
              ]);
              downloadCsv(csv, `profit-loss-${startDate}-to-${endDate}`);
            }}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <PrintButton />
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {report && (
        <>
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
            <Card className={report.netProfit >= 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}>
              <p className={`text-xs font-medium uppercase tracking-wider ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Net {report.netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className={`mt-1 text-2xl font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(report.netProfit))}
              </p>
            </Card>
          </div>

          {/* Monthly Breakdown Table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Monthly Breakdown</h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <Table
                columns={columns}
                data={report.monthlyBreakdown as unknown as MonthRow[]}
                emptyMessage="No data in this period"
                emptyIcon={<TrendingUp className="h-6 w-6" />}
                keyExtractor={(r) => r.month}
              />
            </div>
          </div>
        </>
      )}

      {!isLoading && !report && <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No data available for the selected period" />}
    </div>
  );
}
