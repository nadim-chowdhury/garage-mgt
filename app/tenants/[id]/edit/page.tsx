'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTenantByIdQuery, useUpdateTenantMutation } from '@/store/api/tenantApi';
import TenantForm from '@/components/forms/TenantForm';
import { Card, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import type { CreateTenantInput } from '@/types';

export default function EditTenantPage(props: PageProps<'/tenants/[id]/edit'>) {
  return <EditTenantContent paramsPromise={props.params} />;
}

function EditTenantContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { data: tenantRes, isLoading } = useGetTenantByIdQuery(id);
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();

  const tenant = tenantRes?.data;

  async function handleSubmit(data: CreateTenantInput) {
    try {
      const result = await updateTenant({ id, ...data }).unwrap();
      if (result.success) {
        success('Tenant updated successfully');
        router.push(`/tenants/${id}`);
      }
    } catch {
      showError('Failed to update tenant');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Tenant</h1>
        <p className="mt-1 text-sm text-slate-500">
          {tenant.name} — তথ্য সম্পাদনা করুন
        </p>
      </div>

      <Card>
        <TenantForm
          initialData={tenant}
          onSubmit={handleSubmit}
          loading={isUpdating}
        />
      </Card>
    </div>
  );
}

