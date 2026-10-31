import { baseApi } from './baseApi';
import type {
  Tenant,
  ApiResponse,
  CreateTenantInput,
  UpdateTenantInput,
  PaginationParams,
} from '@/types';

interface TenantListParams extends PaginationParams {
  status?: string;
}

export const tenantApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTenants: build.query<ApiResponse<Tenant[]>, TenantListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.search) searchParams.set('search', params.search);
        if (params?.status) searchParams.set('status', params.status);
        const qs = searchParams.toString();
        return `/tenants${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Tenant' as const, id })),
              { type: 'Tenant', id: 'LIST' },
            ]
          : [{ type: 'Tenant', id: 'LIST' }],
    }),

    getTenantById: build.query<ApiResponse<Tenant>, string>({
      query: (id) => `/tenants/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tenant', id }],
    }),

    createTenant: build.mutation<ApiResponse<Tenant>, CreateTenantInput>({
      query: (body) => ({
        url: '/tenants',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Tenant', id: 'LIST' }, 'Dashboard'],
    }),

    updateTenant: build.mutation<
      ApiResponse<Tenant>,
      { id: string } & UpdateTenantInput
    >({
      query: ({ id, ...body }) => ({
        url: `/tenants/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tenant', id },
        { type: 'Tenant', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteTenant: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/tenants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tenant', id: 'LIST' }, 'Dashboard'],
    }),
  }),
});

export const {
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = tenantApi;

