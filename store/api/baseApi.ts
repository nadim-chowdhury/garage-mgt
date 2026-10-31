import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: [
    'Tenant',
    'Vehicle',
    'DailyEntry',
    'Income',
    'Expense',
    'RentPayment',
    'Dashboard',
    'CashBook',
    'Report',
    'User',
    'AuditLog',
  ],
  endpoints: () => ({}), // injected by feature API slices
});

