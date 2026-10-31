'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetTenantByIdQuery, useDeleteTenantMutation } from '@/store/api/tenantApi';
import { useGetVehiclesQuery } from '@/store/api/vehicleApi';
import { Button, Badge, Card, LoadingSpinner, Table, ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { Vehicle } from '@/types';
import {
  formatCurrency,
  formatDate,
  getVehicleTypeLabel,
} from '@/lib/utils';
import { Car } from 'lucide-react';

export default function TenantDetailPage(props: PageProps<'/tenants/[id]'>) {
  return <TenantDetailContent paramsPromise={props.params} />;
}

function TenantDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);

  const router = useRouter();
  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();
  const { data: tenantRes, isLoading } = useGetTenantByIdQuery(id);
  const { data: vehiclesRes } = useGetVehiclesQuery({ tenantId: id });
  const [deleteTenant, { isLoading: isDeleting }] = useDeleteTenantMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tenant = tenantRes?.data;
  const vehicles = vehiclesRes?.data ?? [];

  async function handleDelete() {
    try {
      await deleteTenant(id).unwrap();
      success('Tenant deleted successfully');
      router.push('/tenants');
    } catch {
      showError('Failed to delete tenant');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Tenant not found</p>
      </div>
    );
  }

  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle No.',
      render: (r) => (
        <Link
          href={`/vehicles/${r.id}`}
          className="font-medium text-primary-600 hover:text-primary-800 hover:underline"
        >
          {r.vehicleNumber}
        </Link>
      ),
    },
    { key: 'vehicleType', header: 'Type', render: (r) => getVehicleTypeLabel(r.vehicleType) },
    { key: 'ownerName', header: 'Owner', render: (r) => r.ownerName || '—' },
    { key: 'driverName', header: 'Driver', render: (r) => r.driverName || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>
          {r.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <Link href={`/vehicles/${r.id}`}>
            <Button variant="ghost" size="sm">
              View / Edit
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{tenant.mobile}</p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <Link href={`/tenants/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Tenant Information">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <InfoRow label="Name" value={tenant.name} />
            <InfoRow label="Mobile" value={tenant.mobile} />
            <InfoRow label="NID" value={tenant.nid || '—'} />
            <InfoRow label="Vehicle Type" value={getVehicleTypeLabel(tenant.vehicleType)} />
            <InfoRow label="Address" value={tenant.address || '—'} />
            <InfoRow
              label="Status"
              value={
                <Badge variant={tenant.status === 'active' ? 'success' : 'neutral'}>
                  {tenant.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
            <InfoRow label="Joined" value={formatDate(tenant.createdAt)} />
          </dl>
        </Card>

        <Card title="Financial Details">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <InfoRow
              label="Monthly Rent"
              value={<span className="font-semibold text-indigo-600">{formatCurrency(tenant.monthlyRent)}</span>}
            />
            <InfoRow label="Rent Due Day" value={`Day ${tenant.rentDueDay} of each month`} />
            <InfoRow
              label="Security Deposit"
              value={formatCurrency(tenant.securityDeposit)}
            />
          </dl>
          {tenant.notes && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{tenant.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Vehicles */}
      <Card title="Vehicles" noPadding>
        <Table
          columns={vehicleColumns}
          data={vehicles}
          emptyMessage="No vehicles registered"
          emptyIcon={<Car className="h-6 w-6" />}
          keyExtractor={(row) => row.id as string}
        />
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This will also delete all associated vehicles. This action cannot be undone."
        loading={isDeleting}
      />
    </div>
  );
}

// ── Helper component ───────────────────────────────────────
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{value}</dd>
    </div>
  );
}
