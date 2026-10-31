'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegisterMutation } from '@/store/api/authApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    garageName: '',
    garageAddress: '',
  });
  const [error, setError] = useState('');

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim() || !form.password || !form.garageName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        garageName: form.garageName.trim(),
        garageAddress: form.garageAddress.trim(),
      }).unwrap();
      router.push('/');
    } catch (err) {
      const apiError = err as { data?: { error?: string } };
      setError(apiError.data?.error ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white text-2xl font-bold shadow-lg shadow-indigo-200">
          G
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Set Up Your Garage
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create your garage and admin account
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {error}
            </div>
          )}

          {/* Garage Info */}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Garage Information</h2>
            <p className="text-xs text-slate-500">Your garage details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="garageName"
              label="Garage Name"
              placeholder="e.g. ABC Garage"
              value={form.garageName}
              onChange={(e) => update('garageName', e.target.value)}
              required
              autoFocus
            />
            <Input
              id="garageAddress"
              label="Address"
              placeholder="Location"
              value={form.garageAddress}
              onChange={(e) => update('garageAddress', e.target.value)}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Admin Account */}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Admin Account</h2>
            <p className="text-xs text-slate-500">Your login credentials</p>
          </div>

          <Input
            id="name"
            label="Full Name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />

          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            placeholder="01XXXXXXXXX"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
            autoComplete="tel"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              autoComplete="new-password"
            />
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
          >
            Create Garage & Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

