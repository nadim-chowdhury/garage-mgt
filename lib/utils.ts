import type {
  PaymentStatus,
  TenantStatus,
  PaymentMethod,
  VehicleType,
  IncomeCategory,
  ExpenseCategory,
} from '@/types';

// ── Debounce ───────────────────────────────────────────────
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Class-name merge utility ───────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Currency ───────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return `৳ ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Dates (Bangladesh timezone UTC+6) ──────────────────────
const BD_LOCALE = 'en-GB'; // dd/MM/yyyy style
const BD_TZ = 'Asia/Dhaka';

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(BD_LOCALE, { timeZone: BD_TZ });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(BD_LOCALE, {
    timeZone: BD_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getCurrentBDTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: BD_TZ }),
  );
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Receipt Number ─────────────────────────────────────────
export function generateReceiptNumber(): string {
  const now = getCurrentBDTime();
  const datePart = toISODate(now).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCT-${datePart}-${rand}`;
}

// ── Status Colours (Tailwind) ──────────────────────────────
export function getPaymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    unpaid: 'bg-slate-50 text-slate-600 ring-slate-500/20',
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  };
  return map[status];
}

export function getTenantStatusColor(status: TenantStatus): string {
  const map: Record<TenantStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    inactive: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  };
  return map[status];
}

// ── Display Labels ─────────────────────────────────────────
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    paid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
  };
  return map[status];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    cash: 'Cash',
    bank: 'Bank Transfer',
    mobile_banking: 'Mobile Banking',
  };
  return map[method];
}

export function getVehicleTypeLabel(type: VehicleType): string {
  const map: Record<VehicleType, string> = {
    car: 'Car',
    microbus: 'Microbus',
    bus: 'Bus',
    truck: 'Truck',
    pickup: 'Pickup',
    auto_rickshaw: 'Auto Rickshaw',
    motorcycle: 'Motorcycle',
    other: 'Other',
  };
  return map[type];
}

export function getIncomeCategoryLabel(category: IncomeCategory): string {
  const map: Record<IncomeCategory, string> = {
    monthly_rent: 'Monthly Rent',
    daily_vehicle_charge: 'Daily Vehicle Charge',
    security_deposit: 'Security Deposit',
    other: 'Other',
  };
  return map[category];
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const map: Record<ExpenseCategory, string> = {
    electricity: 'Electricity Bill',
    water: 'Water Bill',
    repair_maintenance: 'Repair & Maintenance',
    salary: 'Salary',
    other: 'Other',
  };
  return map[category];
}

