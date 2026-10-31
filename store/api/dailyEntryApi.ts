import { baseApi } from './baseApi';
import type {
  DailyVehicleEntry,
  ApiResponse,
  CreateDailyEntryInput,
  UpdateDailyEntryInput,
  PaginationParams,
} from '@/types';

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
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'DailyEntry' as const, id })),
              { type: 'DailyEntry', id: 'LIST' },
            ]
          : [{ type: 'DailyEntry', id: 'LIST' }],
    }),

    createDailyEntry: build.mutation<ApiResponse<DailyVehicleEntry>, CreateDailyEntryInput>({
      query: (body) => ({ url: '/daily-entries', method: 'POST', body }),
      invalidatesTags: [
        { type: 'DailyEntry', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    updateDailyEntry: build.mutation<
      ApiResponse<DailyVehicleEntry>,
      { id: string } & UpdateDailyEntryInput
    >({
      query: ({ id, ...body }) => ({
        url: `/daily-entries/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DailyEntry', id },
        { type: 'DailyEntry', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteDailyEntry: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/daily-entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'DailyEntry', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDailyEntriesQuery,
  useCreateDailyEntryMutation,
  useUpdateDailyEntryMutation,
  useDeleteDailyEntryMutation,
} = dailyEntryApi;
