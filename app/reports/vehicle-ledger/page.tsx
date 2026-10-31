'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetVehicleLedgerQuery } from '@/store/api/reportApi';
import { useGetVehiclesQuery } from '@/store/api/vehicleApi';
import { Card, Select, Table, LoadingSpinner, EmptyState, PrintButton } from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import type { IncomeEntry } from '@/types';
import { formatCurrency, formatDate, getIncomeCategoryLabel, getPaymentMethodLabel, getVehicleTypeLabel } from '@/lib/utils';
import { Car } from 'lucide-react';

export default function VehicleLedgerPage() {
  const [vehicleId, setVehicleId] = useState('');
  const { data: vehiclesRes } = useGetVehiclesQuery({ limit: 200 });
  const { data, isLoading, isFetching } = useGetVehicleLedgerQuery(
    { vehicleId },
    { skip: !vehicleId },
  );

  const vehicles = vehiclesRes?.data ?? [];
  const report = data?.data;

  const columns: Column<IncomeEntry>[] = [
    { key: 'incomeDate', header: 'Date', render: (r) => formatDate(r.incomeDate) },
    { key: 'category', header: 'Category', render: (r) => getIncomeCategoryLabel(r.category) },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-600">{formatCurrency(r.amount)}</span> },
    { key: 'paymentMethod', header: 'Method', render: (r) => getPaymentMethodLabel(r.paymentMethod) },
    { key: 'notes', header: 'Notes', render: (r) => <span className="max-w-[200px] truncate block">{r.notes || '—'}</span> },
  ];

  const totalIncome = report?.incomeEntries.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Vehicle Ledger</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Ledger</h1>
        <p className="mt-1 text-sm text-slate-500">প্রতিটি গাড়ির লেনদেনের ইতিহাস</p>
      </div>

      <div className="max-w-sm">
        <Select
          label="Select Vehicle"
          placeholder="Choose a vehicle..."
          options={vehicles.map((v) => ({ value: v.id, label: `${v.vehicleNumber} — ${v.ownerName}` }))}
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        />
      </div>

      {!vehicleId && <EmptyState icon={<Car className="h-6 w-6" />} title="Select a vehicle to view its ledger" />}

      {vehicleId && isLoading && <LoadingSpinner />}

      {report && (
        <>
          {/* Actions */}
          <div className="flex justify-end" data-no-print>
            <PrintButton />
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{report.vehicle.vehicleNumber}</p>
              <p className="text-sm text-slate-500">{getVehicleTypeLabel(report.vehicle.vehicleType)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Owner / Tenant</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{report.vehicle.ownerName}</p>
              {report.vehicle.tenantName && (
                <p className="text-sm text-slate-500">{report.vehicle.tenantName}</p>
              )}
            </Card>
            <Card>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Income</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
              <p className="text-sm text-slate-500">{report.incomeEntries.length} entries</p>
            </Card>
          </div>

          {/* Transactions */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Transaction History</h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <Table
                columns={columns}
                data={report.incomeEntries as unknown as IncomeEntry[]}
                loading={isFetching}
                emptyMessage="No transactions found for this vehicle"
                emptyIcon={<Car className="h-6 w-6" />}
                keyExtractor={(r) => r.id}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
