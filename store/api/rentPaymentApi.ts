import { baseApi } from './baseApi';
import type {
  RentPayment,
  ApiResponse,
  CreateRentPaymentInput,
  UpdateRentPaymentInput,
  PaginationParams,
} from '@/types';

interface RentPaymentParams extends PaginationParams {
  tenantId?: string;
  month?: string;
  year?: string;
  status?: string;
}

export const rentPaymentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRentPayments: build.query<ApiResponse<RentPayment[]>, RentPaymentParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.page) sp.set('page', String(params.page));
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.tenantId) sp.set('tenantId', params.tenantId);
        if (params?.month) sp.set('month', params.month);
        if (params?.year) sp.set('year', params.year);
        if (params?.status) sp.set('status', params.status);
        const qs = sp.toString();
        return `/rent-payments${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'RentPayment' as const, id })),
              { type: 'RentPayment', id: 'LIST' },
            ]
          : [{ type: 'RentPayment', id: 'LIST' }],
    }),

    createRentPayment: build.mutation<ApiResponse<RentPayment>, CreateRentPaymentInput>({
      query: (body) => ({ url: '/rent-payments', method: 'POST', body }),
      invalidatesTags: [
        { type: 'RentPayment', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    updateRentPayment: build.mutation<
      ApiResponse<RentPayment>,
      { id: string } & UpdateRentPaymentInput
    >({
      query: ({ id, ...body }) => ({
        url: `/rent-payments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'RentPayment', id },
        { type: 'RentPayment', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteRentPayment: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/rent-payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'RentPayment', id: 'LIST' },
        'Dashboard',
        'Income',
        'CashBook',
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetRentPaymentsQuery,
  useCreateRentPaymentMutation,
  useUpdateRentPaymentMutation,
  useDeleteRentPaymentMutation,
} = rentPaymentApi;
