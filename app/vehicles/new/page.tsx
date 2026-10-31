'use client';

import { useRouter } from 'next/navigation';
import { useCreateVehicleMutation } from '@/store/api/vehicleApi';
import { useGetTenantsQuery } from '@/store/api/tenantApi';
import { useToast } from '@/components/ui/Toast';
import VehicleForm from '@/components/forms/VehicleForm';
import Card from '@/components/ui/Card';
import type { CreateVehicleInput } from '@/types';

export default function NewVehiclePage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { data: tenantsRes } = useGetTenantsQuery({ limit: 100 });
  const [createVehicle, { isLoading }] = useCreateVehicleMutation();

  const tenants = tenantsRes?.data ?? [];

  async function handleSubmit(data: CreateVehicleInput) {
    try {
      const result = await createVehicle(data).unwrap();
      if (result.success) {
        success('Vehicle added successfully');
        router.push('/vehicles');
      }
    } catch {
      showError('Failed to add vehicle');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Vehicle</h1>
        <p className="mt-1 text-sm text-slate-500">
          নতুন গাড়ির তথ্য যুক্ত করুন
        </p>
      </div>

      <Card>
        <VehicleForm
          tenants={tenants}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/vehicles')}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}

