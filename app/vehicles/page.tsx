'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} from '@/store/api/vehicleApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
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
import type { Vehicle, CreateVehicleInput } from '@/types';
import { getVehicleTypeLabel } from '@/lib/utils';
import VehicleForm from '@/components/forms/VehicleForm';
import { Car, Pencil, Trash2 } from 'lucide-react';

interface VehicleRow extends Vehicle {
  tenantName?: string;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRow | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRow | null>(null);

  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();

  const { data, isLoading } = useGetVehiclesQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100 });
  const [createVehicle, { isLoading: isCreating }] = useCreateVehicleMutation();
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateVehicleMutation();
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation();

  const vehicles = (data?.data ?? []) as unknown as VehicleRow[];
  const meta = data?.meta;
  const tenants = tenantsRes?.data ?? [];

  async function handleCreate(formData: CreateVehicleInput) {
    try {
      const result = await createVehicle(formData).unwrap();
      if (result.success) {
        success('Vehicle created successfully');
        setShowAddModal(false);
      }
    } catch {
      showError('Failed to create vehicle');
    }
  }

  async function handleUpdate(formData: CreateVehicleInput) {
    if (!editingVehicle) return;
    try {
      const result = await updateVehicle({
        id: editingVehicle.id,
        ...formData,
      }).unwrap();
      if (result.success) {
        success('Vehicle updated successfully');
        setEditingVehicle(null);
      }
    } catch {
      showError('Failed to update vehicle');
    }
  }

  async function handleDelete() {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicle(vehicleToDelete.id).unwrap();
      success('Vehicle deleted successfully');
      setVehicleToDelete(null);
    } catch {
      showError('Failed to delete vehicle');
    }
  }

  const columns: Column<VehicleRow>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle Number',
      render: (row) => (
        <span className="font-medium text-slate-900">{row.vehicleNumber}</span>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Type',
      render: (row) => getVehicleTypeLabel(row.vehicleType),
    },
    {
      key: 'tenantName',
      header: 'Tenant',
      hideOnMobile: true,
      render: (row) => row.tenantName || '—',
    },
    {
      key: 'ownerName',
      header: 'Owner',
      hideOnMobile: true,
      render: (row) => row.ownerName || '—',
    },
    {
      key: 'driverName',
      header: 'Driver',
      hideOnMobile: true,
      render: (row) => row.driverName || '—',
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
            key: 'actions' as keyof VehicleRow,
            header: 'Actions',
            render: (r: VehicleRow) => (
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setEditingVehicle(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit vehicle"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setVehicleToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete vehicle"
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
          <h1 className="text-2xl font-bold text-slate-900">Vehicles</h1>
          <p className="mt-1 text-sm text-slate-500">গাড়ি ব্যবস্থাপনা</p>
        </div>
        {canWrite && <Button onClick={() => setShowAddModal(true)}>+ Add Vehicle</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <SearchInput
            placeholder="Search by number, owner, driver..."
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={vehicles}
          loading={isLoading}
          emptyMessage="No vehicles found"
          emptyIcon={<Car className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/vehicles/${row.id}`)}
          keyExtractor={(row) => row.id}
        />
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vehicle"
        size="lg"
      >
        <VehicleForm
          tenants={tenants}
          onSubmit={handleCreate}
          onCancel={() => setShowAddModal(false)}
          loading={isCreating}
        />
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={Boolean(editingVehicle)}
        onClose={() => setEditingVehicle(null)}
        title={`Edit Vehicle — ${editingVehicle?.vehicleNumber ?? ''}`}
        size="lg"
      >
        {editingVehicle && (
          <VehicleForm
            initialData={editingVehicle}
            tenants={tenants}
            onSubmit={handleUpdate}
            onCancel={() => setEditingVehicle(null)}
            loading={isUpdating}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(vehicleToDelete)}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${vehicleToDelete?.vehicleNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
