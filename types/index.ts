// ============================================================
// Garage Management System — Type Definitions
// ============================================================

// --- Union Types (used as enums) ---

export type UserRole = 'admin' | 'operator' | 'viewer';

export type UserStatus = 'active' | 'inactive';

export type PaymentMethod = 'cash' | 'bank' | 'mobile_banking';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export type TenantStatus = 'active' | 'inactive';

export type VehicleType =
  | 'car'
  | 'microbus'
  | 'bus'
  | 'truck'
  | 'pickup'
  | 'auto_rickshaw'
  | 'motorcycle'
  | 'other';

export type IncomeCategory =
  | 'monthly_rent'
  | 'daily_vehicle_charge'
  | 'security_deposit'
  | 'other';

export type ExpenseCategory =
  | 'electricity'
  | 'water'
  | 'repair_maintenance'
  | 'salary'
  | 'other';

// --- Database Entity Interfaces ---

export interface Garage {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  ownerMobile: string;
  createdAt: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  garageId: string;
  garageName: string;
  status: UserStatus;
  createdAt: string;
}

export interface SessionPayload {
  userId: string;
  garageId: string;
  role: UserRole;
  name: string;
  garageName: string;
}

export interface Tenant {
  id: string;
  name: string;
  mobile: string;
  nid: string;
  address: string;
  vehicleType: VehicleType;
  monthlyRent: number;
  rentDueDay: number; // 1–28
  securityDeposit: number;
  status: TenantStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  ownerName: string;
  ownerMobile: string;
  driverName: string;
  driverMobile: string;
  notes: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyVehicleEntry {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  ownerName: string;
  ownerMobile: string;
  driverName: string;
  chargeAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string;
  entryDate: string;
  entryTime: string;
  exitTime: string | null;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  tenantId: string | null;
  vehicleId: string | null;
  dailyEntryId: string | null;
  incomeDate: string;
  category: IncomeCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  notes: string;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  tenantId: string;
  rentMonth: number; // 1–12
  rentYear: number;
  rentAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string | null;
  dueDate: string;
  receiptNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Composite / Joined Types ---

export interface TenantWithVehicles extends Tenant {
  vehicles: Vehicle[];
}

export interface RentPaymentWithTenant extends RentPayment {
  tenant: Pick<Tenant, 'id' | 'name' | 'mobile' | 'vehicleType'>;
}

export interface IncomeEntryWithRelations extends IncomeEntry {
  tenantName: string | null;
  vehicleNumber: string | null;
}

// --- API Envelope ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Dashboard ---

export interface DashboardStats {
  todayIncome: number;
  todayExpense: number;
  totalDues: number;
  activeTenants: number;
  todayVehicles: number;
  monthlyIncome: number;
  monthlyExpense: number;
  overdueRents: number;
}

// --- Cash Book ---

export interface CashBookEntry {
  date: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
}

// --- Filters & Params ---

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// --- Report Types ---

export interface TenantLedgerReport {
  tenant: Pick<Tenant, 'id' | 'name' | 'mobile' | 'monthlyRent' | 'securityDeposit'>;
  rentPayments: RentPayment[];
  incomeEntries: IncomeEntry[];
  summary: {
    totalRent: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface VehicleLedgerReport {
  vehicle: {
    id: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    ownerName: string;
    tenantName: string | null;
  };
  incomeEntries: IncomeEntry[];
}

export interface IncomeExpenseSummaryReport {
  period: DateRangeFilter;
  incomeByCategory: { category: string; total: number; count: number }[];
  expenseByCategory: { category: string; total: number; count: number }[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface ProfitLossReport {
  period: DateRangeFilter;
  monthlyBreakdown: { month: string; income: number; expense: number; net: number }[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface PaymentHistoryReport {
  period: DateRangeFilter;
  payments: (IncomeEntry & { tenantName: string | null; tenantMobile: string | null })[];
  totalAmount: number;
  totalCount: number;
}

export interface MonthlyCollectionReport {
  period: DateRangeFilter;
  dailyBreakdown: { date: string; total: number; count: number }[];
  totalAmount: number;
  totalCount: number;
}

export interface AuditLog {
  id: string;
  garageId: string;
  userId: string | null;
  userName: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

// --- Form Input Types (for create/update without server-generated fields) ---

export type CreateTenantInput = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTenantInput = Partial<CreateTenantInput>;

export type CreateVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export type CreateDailyEntryInput = Omit<DailyVehicleEntry, 'id' | 'createdAt'>;
export type UpdateDailyEntryInput = Partial<CreateDailyEntryInput>;

export type CreateIncomeInput = Omit<IncomeEntry, 'id' | 'createdAt'>;
export type UpdateIncomeInput = Partial<CreateIncomeInput>;

export type CreateExpenseInput = Omit<ExpenseEntry, 'id' | 'createdAt'>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export type CreateRentPaymentInput = Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRentPaymentInput = Partial<CreateRentPaymentInput>;

export interface CreateUserInput {
  phone: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

