import { baseApi } from './baseApi';
import type {
  IncomeEntry,
  ApiResponse,
  CreateIncomeInput,
  UpdateIncomeInput,
  PaginationParams,
} from '@/types';

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
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Income' as const, id })),
              { type: 'Income', id: 'LIST' },
            ]
          : [{ type: 'Income', id: 'LIST' }],
    }),

    createIncome: build.mutation<ApiResponse<IncomeEntry>, CreateIncomeInput>({
      query: (body) => ({ url: '/income', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Income', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    updateIncome: build.mutation<
      ApiResponse<IncomeEntry>,
      { id: string } & UpdateIncomeInput
    >({
      query: ({ id, ...body }) => ({
        url: `/income/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Income', id },
        { type: 'Income', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteIncome: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/income/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Income', id: 'LIST' },
        'Dashboard',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetIncomeEntriesQuery,
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
} = incomeApi;
