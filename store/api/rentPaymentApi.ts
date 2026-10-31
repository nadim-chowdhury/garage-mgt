import { baseApi } from './baseApi';
import type { RentPayment, ApiResponse, CreateRentPaymentInput, PaginationParams } from '@/types';

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
      providesTags: [{ type: 'RentPayment', id: 'LIST' }],
    }),

    createRentPayment: build.mutation<ApiResponse<RentPayment>, CreateRentPaymentInput>({
      query: (body) => ({ url: '/rent-payments', method: 'POST', body }),
      invalidatesTags: [{ type: 'RentPayment', id: 'LIST' }, 'Dashboard', 'Income', 'CashBook'],
    }),
  }),
});

export const { useGetRentPaymentsQuery, useCreateRentPaymentMutation } = rentPaymentApi;

