import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, Tenant } from '@/types';

// ── GET /api/tenants ───────────────────────────────────────
export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`garage_id = $1`];
    const params: unknown[] = [garageId];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR mobile ILIKE $${params.length})`);
    }
    if (status === 'active' || status === 'inactive') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM tenants ${where}`,
      params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        id, name, mobile, nid, address,
        vehicle_type     AS "vehicleType",
        monthly_rent     AS "monthlyRent",
        rent_due_day     AS "rentDueDay",
        security_deposit AS "securityDeposit",
        status, notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tenants
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const response: ApiResponse<Tenant[]> = {
      success: true,
      data: rows as Tenant[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenants';
    return NextResponse.json({ success: false, error: message } satisfies ApiResponse<never>, { status: 500 });
  }
});

// ── POST /api/tenants ──────────────────────────────────────
export const POST = withWriteAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const body = await request.json();
    const { name, mobile, nid, address, vehicleType, monthlyRent, rentDueDay, securityDeposit, status, notes } = body;

    if (!name || !mobile) {
      return NextResponse.json(
        { success: false, error: 'Name and mobile are required' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const rows = await sql`
      INSERT INTO tenants (garage_id, name, mobile, nid, address, vehicle_type, monthly_rent, rent_due_day, security_deposit, status, notes)
      VALUES (${garageId}, ${name}, ${mobile}, ${nid ?? ''}, ${address ?? ''}, ${vehicleType ?? 'other'}, ${Number(monthlyRent) || 0}, ${Number(rentDueDay) || 1}, ${Number(securityDeposit) || 0}, ${status ?? 'active'}, ${notes ?? ''})
      RETURNING
        id, name, mobile, nid, address,
        vehicle_type     AS "vehicleType",
        monthly_rent     AS "monthlyRent",
        rent_due_day     AS "rentDueDay",
        security_deposit AS "securityDeposit",
        status, notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const newTenant = rows[0] as Tenant;

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'tenant',
      entityId: newTenant.id,
      details: `Created tenant ${newTenant.name} (${newTenant.mobile})`,
    });

    return NextResponse.json(
      { success: true, data: newTenant } satisfies ApiResponse<Tenant>,
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tenant';
    return NextResponse.json({ success: false, error: message } satisfies ApiResponse<never>, { status: 500 });
  }
});
