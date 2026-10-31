'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMonthlyCollectionQuery } from '@/store/api/reportApi';
import { Card, DatePicker, Table, LoadingSpinner, EmptyState, Button, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateCsv, downloadCsv } from '@/lib/csv';
import { Calendar, Download } from 'lucide-react';

interface DailyRow {
  date: string;
  total: number;
  count: number;
}

export default function MonthlyCollectionPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useGetMonthlyCollectionQuery({ startDate, endDate });
  const report = data?.data;

  const columns: Column<DailyRow>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'count', header: 'Entries', render: (r) => r.count },
    { key: 'total', header: 'Collection', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(Number(r.total))}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Monthly Collection</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Monthly Collection Report</h1>
        <p className="mt-1 text-sm text-slate-500">মাসে মোট কত টাকা আদায় হয়েছে</p>
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
              const csv = generateCsv(report.dailyBreakdown as unknown as DailyRow[], [
                { header: 'Date', accessor: (r) => formatDate(r.date) },
                { header: 'Entries', accessor: (r) => r.count },
                { header: 'Collection', accessor: (r) => Number(r.total) },
              ]);
              downloadCsv(csv, `monthly-collection-${startDate}-to-${endDate}`);
            }}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
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

          {/* Daily Breakdown */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Daily Breakdown</h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <Table
                columns={columns}
                data={report.dailyBreakdown as unknown as DailyRow[]}
                emptyMessage="No collections in this period"
                emptyIcon={<Calendar className="h-6 w-6" />}
                keyExtractor={(r) => r.date}
              />
            </div>
          </div>
        </>
      )}

      {!isLoading && !report && <EmptyState icon={<Calendar className="h-6 w-6" />} title="No data available for the selected period" />}
    </div>
  );
}
