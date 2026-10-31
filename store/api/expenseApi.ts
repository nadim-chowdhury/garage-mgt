import { baseApi } from './baseApi';
import type {
  ExpenseEntry,
  ApiResponse,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaginationParams,
} from '@/types';

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
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    createExpense: build.mutation<ApiResponse<ExpenseEntry>, CreateExpenseInput>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Expense', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    updateExpense: build.mutation<
      ApiResponse<ExpenseEntry>,
      { id: string } & UpdateExpenseInput
    >({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteExpense: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Expense', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetExpenseEntriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
