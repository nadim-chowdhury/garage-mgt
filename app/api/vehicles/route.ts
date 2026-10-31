import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse } from '@/types';

// ── GET /api/vehicles ──────────────────────────────────────
export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const search = searchParams.get('search') ?? '';
    const tenantId = searchParams.get('tenantId') ?? '';
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`v.garage_id = $1`];
    const params: unknown[] = [garageId];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(v.vehicle_number ILIKE $${params.length} OR v.owner_name ILIKE $${params.length} OR v.driver_name ILIKE $${params.length})`);
    }
    if (tenantId) {
      params.push(tenantId);
      conditions.push(`v.tenant_id = $${params.length}`);
    }
    if (status === 'active' || status === 'inactive') {
      params.push(status);
      conditions.push(`v.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM vehicles v ${where}`,
      params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        v.id, v.tenant_id AS "tenantId",
        v.vehicle_number AS "vehicleNumber",
        v.vehicle_type   AS "vehicleType",
        v.owner_name     AS "ownerName",
        v.owner_mobile   AS "ownerMobile",
        v.driver_name    AS "driverName",
        v.driver_mobile  AS "driverMobile",
        v.notes, v.status,
        v.created_at AS "createdAt",
        v.updated_at AS "updatedAt",
        t.name AS "tenantName"
      FROM vehicles v
      LEFT JOIN tenants t ON t.id = v.tenant_id
      ${where}
      ORDER BY v.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    } satisfies ApiResponse<unknown[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vehicles';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── POST /api/vehicles ─────────────────────────────────────
export const POST = withWriteAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const body = await request.json();
    const { tenantId, vehicleNumber, vehicleType, ownerName, ownerMobile, driverName, driverMobile, notes, status } = body;

    if (!tenantId || !vehicleNumber) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and vehicle number are required' },
        { status: 400 },
      );
    }

    const rows = await sql`
      INSERT INTO vehicles (garage_id, tenant_id, vehicle_number, vehicle_type, owner_name, owner_mobile, driver_name, driver_mobile, notes, status)
      VALUES (${garageId}, ${tenantId}, ${vehicleNumber}, ${vehicleType ?? 'other'}, ${ownerName ?? ''}, ${ownerMobile ?? ''}, ${driverName ?? ''}, ${driverMobile ?? ''}, ${notes ?? ''}, ${status ?? 'active'})
      RETURNING
        id, tenant_id AS "tenantId",
        vehicle_number AS "vehicleNumber",
        vehicle_type   AS "vehicleType",
        owner_name     AS "ownerName",
        owner_mobile   AS "ownerMobile",
        driver_name    AS "driverName",
        driver_mobile  AS "driverMobile",
        notes, status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const newVehicle = rows[0];

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'vehicle',
      entityId: newVehicle.id,
      details: `Created vehicle ${newVehicle.vehicleNumber}`,
    });

    return NextResponse.json({ success: true, data: newVehicle }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create vehicle';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
