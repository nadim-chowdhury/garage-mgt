import { baseApi } from './baseApi';
import type {
  ApiResponse,
  TenantLedgerReport,
  VehicleLedgerReport,
  IncomeExpenseSummaryReport,
  ProfitLossReport,
  PaymentHistoryReport,
  MonthlyCollectionReport,
  DateRangeFilter,
} from '@/types';

interface TenantReportParams {
  tenantId: string;
}

interface VehicleReportParams {
  vehicleId: string;
}

interface PaymentHistoryParams extends DateRangeFilter {
  tenantId?: string;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTenantLedger: build.query<ApiResponse<TenantLedgerReport>, TenantReportParams>({
      query: ({ tenantId }) => `/reports/tenant-ledger?tenantId=${tenantId}`,
      providesTags: ['Report'],
    }),

    getVehicleLedger: build.query<ApiResponse<VehicleLedgerReport>, VehicleReportParams>({
      query: ({ vehicleId }) => `/reports/vehicle-ledger?vehicleId=${vehicleId}`,
      providesTags: ['Report'],
    }),

    getIncomeExpenseSummary: build.query<ApiResponse<IncomeExpenseSummaryReport>, DateRangeFilter>({
      query: ({ startDate, endDate }) =>
        `/reports/income-expense-summary?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Report'],
    }),

    getProfitLoss: build.query<ApiResponse<ProfitLossReport>, DateRangeFilter>({
      query: ({ startDate, endDate }) =>
        `/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Report'],
    }),

    getPaymentHistory: build.query<ApiResponse<PaymentHistoryReport>, PaymentHistoryParams>({
      query: ({ startDate, endDate, tenantId }) => {
        const sp = new URLSearchParams({ startDate, endDate });
        if (tenantId) sp.set('tenantId', tenantId);
        return `/reports/payment-history?${sp.toString()}`;
      },
      providesTags: ['Report'],
    }),

    getMonthlyCollection: build.query<ApiResponse<MonthlyCollectionReport>, DateRangeFilter>({
      query: ({ startDate, endDate }) =>
        `/reports/monthly-collection?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useGetTenantLedgerQuery,
  useGetVehicleLedgerQuery,
  useGetIncomeExpenseSummaryQuery,
  useGetProfitLossQuery,
  useGetPaymentHistoryQuery,
  useGetMonthlyCollectionQuery,
} = reportApi;

