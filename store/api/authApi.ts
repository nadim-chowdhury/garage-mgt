import { baseApi } from './baseApi';
import type { ApiResponse, SessionPayload } from '@/types';

interface LoginRequest {
  phone: string;
  password: string;
}

interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  garageName: string;
  garageAddress?: string;
}

interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  garageId: string;
  garageName: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<{ user: AuthUser }>) =>
        response.data!.user,
      invalidatesTags: [
        'Tenant',
        'Vehicle',
        'DailyEntry',
        'Income',
        'Expense',
        'RentPayment',
        'Dashboard',
        'CashBook',
        'Report',
      ],
    }),

    register: builder.mutation<AuthUser, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<{ user: AuthUser }>) =>
        response.data!.user,
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    getMe: builder.query<SessionPayload, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiResponse<SessionPayload>) =>
        response.data!,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;

