'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} from '@/store/api/tenantApi';
import {
  Button,
  Badge,
  Table,
  Pagination,
  FilterPills,
  Modal,
  SearchInput,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { Tenant, CreateTenantInput } from '@/types';
import { formatCurrency, getVehicleTypeLabel } from '@/lib/utils';
import { Users, Pencil, Trash2 } from 'lucide-react';
import TenantForm from '@/components/forms/TenantForm';

export default function TenantsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const { canWrite, isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();
  const [deleteTenant, { isLoading: isDeleting }] = useDeleteTenantMutation();

  const { data, isLoading } = useGetTenantsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  async function handleDelete() {
    if (!tenantToDelete) return;
    try {
      await deleteTenant(tenantToDelete.id).unwrap();
      success('Tenant deleted successfully');
      setTenantToDelete(null);
    } catch {
      showError('Failed to delete tenant');
    }
  }

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
        <span className="font-medium">{formatCurrency(Number(row.monthlyRent) || 0)}</span>
      ),
    },
    {
      key: 'securityDeposit',
      header: 'Security Deposit',
      hideOnMobile: true,
      render: (row) => formatCurrency(Number(row.securityDeposit) || 0),
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
    ...(canWrite
      ? [
          {
            key: 'actions' as keyof Tenant,
            header: 'Actions',
            render: (r: Tenant) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit tenant"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setTenantToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete tenant"
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">ভাড়াটিয়া ও গাড়ি ব্যবস্থাপনা</p>
        </div>
        {canWrite && <Button onClick={() => setShowModal(true)}>+ Add Tenant</Button>}
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
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
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
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {/* Add Tenant Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Tenant" size="lg">
        <TenantForm
          onSubmit={async (formData: CreateTenantInput) => {
            try {
              const result = await createTenant(formData).unwrap();
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

      {/* Edit Tenant Modal */}
      <Modal
        isOpen={Boolean(editingTenant)}
        onClose={() => setEditingTenant(null)}
        title={`Edit Tenant — ${editingTenant?.name ?? ''}`}
        size="lg"
      >
        {editingTenant && (
          <TenantForm
            initialData={editingTenant}
            onSubmit={async (formData: CreateTenantInput) => {
              try {
                const result = await updateTenant({
                  id: editingTenant.id,
                  ...formData,
                }).unwrap();
                if (result.success) {
                  success('Tenant updated successfully');
                  setEditingTenant(null);
                }
              } catch {
                showError('Failed to update tenant');
              }
            }}
            onCancel={() => setEditingTenant(null)}
            loading={isUpdating}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(tenantToDelete)}
        onClose={() => setTenantToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Tenant"
        message={`Are you sure you want to delete ${tenantToDelete?.name}? This will remove all their associated records.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
