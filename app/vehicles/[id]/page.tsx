'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useGetVehicleByIdQuery,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} from '@/store/api/vehicleApi';
import {
  Button,
  Badge,
  Card,
  LoadingSpinner,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDate, getVehicleTypeLabel } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Pencil, Power, Trash2 } from 'lucide-react';

export default function VehicleDetailPage(props: PageProps<'/vehicles/[id]'>) {
  return <VehicleDetailContent paramsPromise={props.params} />;
}

function VehicleDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { canWrite, isAdmin } = useAuth();

  const { data: res, isLoading } = useGetVehicleByIdQuery(id);
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateVehicleMutation();
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const vehicle = res?.data;

  async function handleToggleStatus() {
    if (!vehicle) return;
    const nextStatus = vehicle.status === 'active' ? 'inactive' : 'active';
    try {
      await updateVehicle({ id, status: nextStatus }).unwrap();
      success(
        `Vehicle ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      );
    } catch {
      showError('Failed to update vehicle status');
    }
  }

  async function handleDelete() {
    try {
      await deleteVehicle(id).unwrap();
      success('Vehicle deleted successfully');
      router.push('/vehicles');
    } catch {
      showError('Failed to delete vehicle');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Vehicle not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/vehicles')}
            aria-label="Back to Vehicles"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {vehicle.vehicleNumber}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {getVehicleTypeLabel(vehicle.vehicleType)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWrite && (
            <>
              <Button
                variant={vehicle.status === 'active' ? 'secondary' : 'primary'}
                onClick={handleToggleStatus}
                loading={isUpdating}
              >
                {vehicle.status === 'active' ? (
                  <>
                    <Power className="h-4 w-4 mr-1.5 text-amber-600" /> Deactivate Vehicle
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Activate Vehicle
                  </>
                )}
              </Button>
              <Link href={`/vehicles/${id}/edit`}>
                <Button variant="secondary">
                  <Pencil className="h-4 w-4 mr-1.5" /> Edit
                </Button>
              </Link>
            </>
          )}

          {isAdmin && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card title="Vehicle Details">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <InfoRow label="Vehicle Number" value={vehicle.vehicleNumber} />
          <InfoRow label="Vehicle Type" value={getVehicleTypeLabel(vehicle.vehicleType)} />
          <InfoRow label="Owner Name" value={vehicle.ownerName || '—'} />
          <InfoRow label="Owner Mobile" value={vehicle.ownerMobile || '—'} />
          <InfoRow label="Driver Name" value={vehicle.driverName || '—'} />
          <InfoRow label="Driver Mobile" value={vehicle.driverMobile || '—'} />
          <InfoRow
            label="Status"
            value={
              <div className="flex items-center gap-2">
                <Badge variant={vehicle.status === 'active' ? 'success' : 'neutral'}>
                  {vehicle.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                {canWrite && (
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className="text-xs text-primary-600 hover:text-primary-800 underline font-medium disabled:opacity-50"
                  >
                    Change to {vehicle.status === 'active' ? 'inactive' : 'active'}
                  </button>
                )}
              </div>
            }
          />
          <InfoRow label="Registered" value={formatDate(vehicle.createdAt)} />
        </dl>
        {vehicle.notes && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{vehicle.notes}</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{value}</dd>
    </div>
  );
}
