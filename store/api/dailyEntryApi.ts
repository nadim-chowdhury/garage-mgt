import { baseApi } from './baseApi';
import type { DailyVehicleEntry, ApiResponse, CreateDailyEntryInput, PaginationParams } from '@/types';

interface DailyEntryParams extends PaginationParams {
  date?: string;
  status?: string;
}

export const dailyEntryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDailyEntries: build.query<ApiResponse<DailyVehicleEntry[]>, DailyEntryParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.page) sp.set('page', String(params.page));
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.date) sp.set('date', params.date);
        if (params?.status) sp.set('status', params.status);
        const qs = sp.toString();
        return `/daily-entries${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'DailyEntry', id: 'LIST' }],
    }),

    createDailyEntry: build.mutation<ApiResponse<DailyVehicleEntry>, CreateDailyEntryInput>({
      query: (body) => ({ url: '/daily-entries', method: 'POST', body }),
      invalidatesTags: [{ type: 'DailyEntry', id: 'LIST' }, 'Dashboard', 'Income', 'CashBook'],
    }),
  }),
});

export const { useGetDailyEntriesQuery, useCreateDailyEntryMutation } = dailyEntryApi;

