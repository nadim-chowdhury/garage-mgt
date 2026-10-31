'use client';

import { useRouter } from 'next/navigation';
import { useCreateTenantMutation } from '@/store/api/tenantApi';
import { useToast } from '@/components/ui/Toast';
import TenantForm from '@/components/forms/TenantForm';
import Card from '@/components/ui/Card';
import type { CreateTenantInput } from '@/types';

export default function NewTenantPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [createTenant, { isLoading }] = useCreateTenantMutation();

  async function handleSubmit(data: CreateTenantInput) {
    try {
      const result = await createTenant(data).unwrap();
      if (result.success) {
        success('Tenant added successfully');
        router.push('/tenants');
      }
    } catch {
      showError('Failed to add tenant');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Tenant</h1>
        <p className="mt-1 text-sm text-slate-500">
          নতুন ভাড়াটিয়ার তথ্য যুক্ত করুন
        </p>
      </div>

      <Card>
        <TenantForm onSubmit={handleSubmit} loading={isLoading} />
      </Card>
    </div>
  );
}
