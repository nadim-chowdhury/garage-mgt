'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTenantsQuery, useCreateTenantMutation } from '@/store/api/tenantApi';
import { Button, Badge, Table, Pagination, Input, FilterPills, Modal, SearchInput } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { Tenant, CreateTenantInput } from '@/types';
import { formatCurrency, getTenantStatusColor, getVehicleTypeLabel } from '@/lib/utils';
import { Users } from 'lucide-react';
import TenantForm from '@/components/forms/TenantForm';

export default function TenantsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { canWrite } = useAuth();
  const { success, error: showError } = useToast();
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();

  const { data, isLoading } = useGetTenantsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.mobile}</p>
        </div>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Vehicle Type',
      hideOnMobile: true,
      render: (row) => getVehicleTypeLabel(row.vehicleType),
    },
    {
      key: 'monthlyRent',
      header: 'Monthly Rent',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.monthlyRent)}</span>
      ),
    },
    {
      key: 'securityDeposit',
      header: 'Security Deposit',
      hideOnMobile: true,
      render: (row) => formatCurrency(row.securityDeposit),
    },
    {
      key: 'rentDueDay',
      header: 'Due Day',
      hideOnMobile: true,
      render: (row) => <span>Day {row.rentDueDay}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">
            ভাড়াটিয়া ও গাড়ি ব্যবস্থাপনা
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowModal(true)}>+ Add Tenant</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <SearchInput
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <FilterPills
            options={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={tenants}
          loading={isLoading}
          emptyMessage="No tenants found"
          emptyIcon={<Users className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/tenants/${row.id}`)}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Add Tenant Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Tenant" size="lg">
        <TenantForm
          onSubmit={async (data: CreateTenantInput) => {
            try {
              const result = await createTenant(data).unwrap();
              if (result.success) {
                success('Tenant added successfully');
                setShowModal(false);
              }
            } catch {
              showError('Failed to add tenant');
            }
          }}
          onCancel={() => setShowModal(false)}
          loading={isCreating}
        />
      </Modal>
    </div>
  );
}

