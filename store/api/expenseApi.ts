import { baseApi } from './baseApi';
import type { ExpenseEntry, ApiResponse, CreateExpenseInput, PaginationParams } from '@/types';

interface ExpenseParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExpenseEntries: build.query<ApiResponse<ExpenseEntry[]>, ExpenseParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.page) sp.set('page', String(params.page));
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.startDate) sp.set('startDate', params.startDate);
        if (params?.endDate) sp.set('endDate', params.endDate);
        if (params?.category) sp.set('category', params.category);
        const qs = sp.toString();
        return `/expenses${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'Expense', id: 'LIST' }],
    }),

    createExpense: build.mutation<ApiResponse<ExpenseEntry>, CreateExpenseInput>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }, 'Dashboard', 'CashBook'],
    }),
  }),
});

export const { useGetExpenseEntriesQuery, useCreateExpenseMutation } = expenseApi;

