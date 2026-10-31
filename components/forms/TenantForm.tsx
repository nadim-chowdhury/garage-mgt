'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea } from '@/components/ui';
import type { Tenant, CreateTenantInput, VehicleType, TenantStatus } from '@/types';

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

const rentDueDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

interface TenantFormProps {
  initialData?: Tenant;
  onSubmit: (data: CreateTenantInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function TenantForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: TenantFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    mobile: initialData?.mobile ?? '',
    nid: initialData?.nid ?? '',
    address: initialData?.address ?? '',
    vehicleType: (initialData?.vehicleType ?? 'other') as VehicleType,
    monthlyRent: initialData?.monthlyRent?.toString() ?? '',
    rentDueDay: (initialData?.rentDueDay ?? 1).toString(),
    securityDeposit: initialData?.securityDeposit?.toString() ?? '',
    status: (initialData?.status ?? 'active') as TenantStatus,
    notes: initialData?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (form.monthlyRent && isNaN(Number(form.monthlyRent)))
      errs.monthlyRent = 'Must be a valid number';
    if (form.securityDeposit && isNaN(Number(form.securityDeposit)))
      errs.securityDeposit = 'Must be a valid number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      nid: form.nid.trim(),
      address: form.address.trim(),
      vehicleType: form.vehicleType,
      monthlyRent: Number(form.monthlyRent) || 0,
      rentDueDay: Number(form.rentDueDay) || 1,
      securityDeposit: Number(form.securityDeposit) || 0,
      status: form.status,
      notes: form.notes.trim(),
    });
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label="Tenant Name"
          required
          placeholder="Enter tenant name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />
        <Input
          id="mobile"
          label="Mobile Number"
          required
          placeholder="01XXXXXXXXX"
          value={form.mobile}
          onChange={(e) => update('mobile', e.target.value)}
          error={errors.mobile}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="nid"
          label="NID Number"
          placeholder="National ID (optional)"
          value={form.nid}
          onChange={(e) => update('nid', e.target.value)}
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

      <Textarea
        id="address"
        label="Address"
        placeholder="Full address (optional)"
        value={form.address}
        onChange={(e) => update('address', e.target.value)}
      />

      {/* Financial Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          id="monthlyRent"
          label="Monthly Rent (৳)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.monthlyRent}
          onChange={(e) => update('monthlyRent', e.target.value)}
          error={errors.monthlyRent}
        />
        <Select
          id="rentDueDay"
          label="Rent Due Day"
          options={rentDueDayOptions}
          value={form.rentDueDay}
          onChange={(e) => update('rentDueDay', e.target.value)}
        />
        <Input
          id="securityDeposit"
          label="Security Deposit (৳)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.securityDeposit}
          onChange={(e) => update('securityDeposit', e.target.value)}
          error={errors.securityDeposit}
        />
      </div>

      {/* Status & Notes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="status"
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
        />
      </div>

      <Textarea
        id="notes"
        label="Notes"
        placeholder="Additional notes (optional)"
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onCancel ? onCancel() : router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? 'Update Tenant' : 'Add Tenant'}
        </Button>
      </div>
    </form>
  );
}

