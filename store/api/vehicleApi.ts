import { baseApi } from './baseApi';
import type {
  Vehicle,
  ApiResponse,
  CreateVehicleInput,
  UpdateVehicleInput,
  PaginationParams,
} from '@/types';

interface VehicleListParams extends PaginationParams {
  tenantId?: string;
  status?: string;
}

export const vehicleApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getVehicles: build.query<ApiResponse<Vehicle[]>, VehicleListParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.page) sp.set('page', String(params.page));
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.search) sp.set('search', params.search);
        if (params?.tenantId) sp.set('tenantId', params.tenantId);
        if (params?.status) sp.set('status', params.status);
        const qs = sp.toString();
        return `/vehicles${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Vehicle' as const, id })),
              { type: 'Vehicle', id: 'LIST' },
            ]
          : [{ type: 'Vehicle', id: 'LIST' }],
    }),

    getVehicleById: build.query<ApiResponse<Vehicle>, string>({
      query: (id) => `/vehicles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Vehicle', id }],
    }),

    createVehicle: build.mutation<ApiResponse<Vehicle>, CreateVehicleInput>({
      query: (body) => ({
        url: '/vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }, 'Dashboard'],
    }),

    updateVehicle: build.mutation<
      ApiResponse<Vehicle>,
      { id: string } & UpdateVehicleInput
    >({
      query: ({ id, ...body }) => ({
        url: `/vehicles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Vehicle', id },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),

    deleteVehicle: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }, 'Dashboard'],
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehicleApi;

