'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useGetVehicleByIdQuery,
  useUpdateVehicleMutation,
} from '@/store/api/vehicleApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import VehicleForm from '@/components/forms/VehicleForm';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import type { CreateVehicleInput } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function EditVehiclePage(props: PageProps<'/vehicles/[id]/edit'>) {
  return <EditVehicleContent paramsPromise={props.params} />;
}

function EditVehicleContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const { success, error: showError } = useToast();

  const { data: vehicleRes, isLoading } = useGetVehicleByIdQuery(id);
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100 });
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateVehicleMutation();

  const vehicle = vehicleRes?.data;
  const tenants = tenantsRes?.data ?? [];

  async function handleSubmit(data: CreateVehicleInput) {
    try {
      const result = await updateVehicle({ id, ...data }).unwrap();
      if (result.success) {
        success('Vehicle updated successfully');
        router.push(`/vehicles/${id}`);
      }
    } catch {
      showError('Failed to update vehicle');
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
      <div className="flex items-center gap-3">
        <Link href={`/vehicles/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Vehicle</h1>
          <p className="mt-1 text-sm text-slate-500">
            {vehicle.vehicleNumber} — তথ্য সম্পাদনা করুন
          </p>
        </div>
      </div>

      <Card>
        <VehicleForm
          initialData={vehicle}
          tenants={tenants}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/vehicles/${id}`)}
          loading={isUpdating}
        />
      </Card>
    </div>
  );
}
