import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/api-auth';
import type { ApiResponse, AuditLog } from '@/types';

// ── GET /api/audit-logs ────────────────────────────────────
export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const entityType = searchParams.get('entityType') ?? '';
    const action = searchParams.get('action') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`garage_id = $1`];
    const params: unknown[] = [garageId];

    if (entityType) {
      params.push(entityType);
      conditions.push(`entity_type = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM audit_logs ${where}`,
      params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        id,
        garage_id   AS "garageId",
        user_id     AS "userId",
        user_name   AS "userName",
        action,
        entity_type AS "entityType",
        entity_id   AS "entityId",
        details,
        created_at  AS "createdAt"
      FROM audit_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const response: ApiResponse<AuditLog[]> = {
      success: true,
      data: rows as AuditLog[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
});

