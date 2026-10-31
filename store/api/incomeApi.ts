import { baseApi } from './baseApi';
import type { IncomeEntry, ApiResponse, CreateIncomeInput, PaginationParams } from '@/types';

interface IncomeParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIncomeEntries: build.query<ApiResponse<IncomeEntry[]>, IncomeParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.page) sp.set('page', String(params.page));
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.startDate) sp.set('startDate', params.startDate);
        if (params?.endDate) sp.set('endDate', params.endDate);
        if (params?.category) sp.set('category', params.category);
        const qs = sp.toString();
        return `/income${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'Income', id: 'LIST' }],
    }),

    createIncome: build.mutation<ApiResponse<IncomeEntry>, CreateIncomeInput>({
      query: (body) => ({ url: '/income', method: 'POST', body }),
      invalidatesTags: [{ type: 'Income', id: 'LIST' }, 'Dashboard', 'CashBook'],
    }),
  }),
});

export const { useGetIncomeEntriesQuery, useCreateIncomeMutation } = incomeApi;

