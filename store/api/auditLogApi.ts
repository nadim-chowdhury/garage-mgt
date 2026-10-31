import { baseApi } from './baseApi';
import type { ApiResponse, AuditLog, PaginationParams } from '@/types';

interface AuditLogParams extends PaginationParams {
  entityType?: string;
  action?: string;
}

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAuditLogs: build.query<ApiResponse<AuditLog[]>, AuditLogParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.entityType) searchParams.set('entityType', params.entityType);
        if (params?.action) searchParams.set('action', params.action);
        const qs = searchParams.toString();
        return `/audit-logs${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
