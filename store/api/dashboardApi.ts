import { baseApi } from './baseApi';
import type { DashboardStats, CashBookEntry, ApiResponse } from '@/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<ApiResponse<DashboardStats>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    getCashBook: build.query<ApiResponse<CashBookEntry>, string | void>({
      query: (date) => `/cash-book${date ? `?date=${date}` : ''}`,
      providesTags: ['CashBook'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetCashBookQuery } = dashboardApi;

