import { baseApi } from './baseApi';
import type { ApiResponse, User, CreateUserInput, UpdateUserInput } from '@/types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<ApiResponse<User[]>, void>({
      query: () => '/users',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    createUser: build.mutation<ApiResponse<User>, CreateUserInput>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'AuditLog', id: 'LIST' }],
    }),

    updateUser: build.mutation<
      ApiResponse<User>,
      { id: string } & UpdateUserInput
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteUser: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'AuditLog', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;

