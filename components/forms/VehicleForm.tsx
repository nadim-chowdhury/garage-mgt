'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea } from '@/components/ui';
import type { Vehicle, CreateVehicleInput, VehicleType, TenantStatus, Tenant } from '@/types';

const vehicleTypeOptions = [
  { value: 'car', label: 'Car' },
  { value: 'microbus', label: 'Microbus' },
  { value: 'bus', label: 'Bus' },
  { value: 'truck', label: 'Truck' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface VehicleFormProps {
  initialData?: Vehicle;
  tenants: Pick<Tenant, 'id' | 'name' | 'mobile'>[];
  preselectedTenantId?: string;
  onSubmit: (data: CreateVehicleInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function VehicleForm({
  initialData,
  tenants,
  preselectedTenantId,
  onSubmit,
  onCancel,
  loading = false,
}: VehicleFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState({
    tenantId: initialData?.tenantId ?? preselectedTenantId ?? '',
    vehicleNumber: initialData?.vehicleNumber ?? '',
    vehicleType: (initialData?.vehicleType ?? 'other') as VehicleType,
    ownerName: initialData?.ownerName ?? '',
    ownerMobile: initialData?.ownerMobile ?? '',
    driverName: initialData?.driverName ?? '',
    driverMobile: initialData?.driverMobile ?? '',
    status: (initialData?.status ?? 'active') as TenantStatus,
    notes: initialData?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.tenantId) errs.tenantId = 'Select a tenant';
    if (!form.vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      tenantId: form.tenantId,
      vehicleNumber: form.vehicleNumber.trim(),
      vehicleType: form.vehicleType,
      ownerName: form.ownerName.trim(),
      ownerMobile: form.ownerMobile.trim(),
      driverName: form.driverName.trim(),
      driverMobile: form.driverMobile.trim(),
      status: form.status,
      notes: form.notes.trim(),
    });
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  const tenantOptions = tenants.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.mobile})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle & Tenant Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="tenantId"
          label="Tenant"
          required
          placeholder="Select tenant..."
          options={tenantOptions}
          value={form.tenantId}
          onChange={(e) => update('tenantId', e.target.value)}
          error={errors.tenantId}
        />
        <Select
          id="vehicleType"
          label="Vehicle Type"
          required
          options={vehicleTypeOptions}
          value={form.vehicleType}
          onChange={(e) => update('vehicleType', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="vehicleNumber"
          label="Vehicle Number"
          required
          placeholder="e.g., DHAKA-1234"
          value={form.vehicleNumber}
          onChange={(e) => update('vehicleNumber', e.target.value)}
          error={errors.vehicleNumber}
        />
        <Select
          id="status"
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
        />
      </div>

      {/* Owner Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="ownerName"
          label="Owner Name"
          placeholder="Vehicle owner"
          value={form.ownerName}
          onChange={(e) => update('ownerName', e.target.value)}
        />
        <Input
          id="ownerMobile"
          label="Owner Mobile"
          placeholder="01XXXXXXXXX"
          value={form.ownerMobile}
          onChange={(e) => update('ownerMobile', e.target.value)}
        />
      </div>

      {/* Driver Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="driverName"
          label="Driver Name"
          placeholder="Driver (optional)"
          value={form.driverName}
          onChange={(e) => update('driverName', e.target.value)}
        />
        <Input
          id="driverMobile"
          label="Driver Mobile"
          placeholder="01XXXXXXXXX"
          value={form.driverMobile}
          onChange={(e) => update('driverMobile', e.target.value)}
        />
      </div>

      <Textarea
        id="notes"
        label="Notes"
        placeholder="Additional notes (optional)"
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
      />

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <Button
          type="button"
          variant="secondary"
          onClick={() => (onCancel ? onCancel() : router.back())}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
    </form>
  );
}

