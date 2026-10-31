'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetVehiclesQuery, useCreateVehicleMutation } from '@/store/api/vehicleApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { Button, Badge, Table, Pagination, Input, Modal } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { Vehicle, CreateVehicleInput } from '@/types';
import { getVehicleTypeLabel } from '@/lib/utils';
import VehicleForm from '@/components/forms/VehicleForm';
import { Car } from 'lucide-react';

/** Extended vehicle row from API (includes tenant name from JOIN) */
interface VehicleRow extends Vehicle {
  tenantName?: string;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { canWrite } = useAuth();

  const { data, isLoading } = useGetVehiclesQuery({ page, limit: 20, search: search || undefined });
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100, status: 'active' });
  const [createVehicle, { isLoading: isCreating }] = useCreateVehicleMutation();

  const vehicles = (data?.data ?? []) as unknown as VehicleRow[];
  const meta = data?.meta;
  const tenants = tenantsRes?.data ?? [];

  async function handleCreate(formData: CreateVehicleInput) {
    const result = await createVehicle(formData).unwrap();
    if (result.success) {
      setShowAddModal(false);
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

      <div className="sm:w-72">
        <Input
          placeholder="Search by number, owner, driver..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vehicle"
        size="lg"
      >
        <VehicleForm
          tenants={tenants}
          onSubmit={handleCreate}
          loading={isCreating}
        />
      </Modal>
    </div>
  );
}
