'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/store/api/auditLogApi';
import {
  Badge,
  Table,
  Pagination,
  Select,
} from '@/components/ui';
import type { Column } from '@/components/ui/Table';
import type { AuditLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { History, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';

const entityOptions = [
  { value: '', label: 'All Entities' },
  { value: 'tenant', label: 'Tenants' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'daily_entry', label: 'Daily Entries' },
  { value: 'rent_payment', label: 'Rent Payments' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'user', label: 'Users' },
];

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit: 25,
    entityType: entityType || undefined,
    action: action || undefined,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  const actionBadge = (act: string) => {
    switch (act) {
      case 'create':
        return (
          <Badge variant="success">
            <span className="flex items-center gap-1">
              <PlusCircle className="h-3 w-3" /> Create
            </span>
          </Badge>
        );
      case 'update':
        return (
          <Badge variant="warning">
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Update
            </span>
          </Badge>
        );
      case 'delete':
        return (
          <Badge variant="danger">
            <span className="flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Delete
            </span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{act}</Badge>;
    }
  };

  const entityTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      tenant: 'Tenant',
      vehicle: 'Vehicle',
      daily_entry: 'Daily Entry',
      rent_payment: 'Rent Payment',
      income: 'Income',
      expense: 'Expense',
      user: 'User',
    };
    return map[type] || type;
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'User / Actor',
      render: (r) => (
        <span className="font-medium text-slate-900">{r.userName}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => actionBadge(r.action),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (r) => (
        <Badge variant="neutral">
          {entityTypeLabel(r.entityType)}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: 'Details & Changes',
      render: (r) => (
        <span className="text-sm text-slate-700">{r.details || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity & Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">গ্যারেজের সমস্ত কাজ ও পরিবর্তনের রেকর্ড</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            label="Filter by Entity"
            options={entityOptions}
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            label="Filter by Action"
            options={actionOptions}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={logs}
          loading={isLoading}
          emptyMessage="No activity logs found"
          emptyIcon={<History className="h-6 w-6" />}
          keyExtractor={(r) => r.id}
        />
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

