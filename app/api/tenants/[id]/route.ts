import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuthRoute, withWriteAuthRoute, withAdminAuthRoute } from '@/lib/api-auth';
import type { ApiResponse, Tenant } from '@/types';

// ── GET /api/tenants/[id] ──────────────────────────────────
export const GET = withAuthRoute(async (
  _req: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/tenants/[id]'>).params;

    const rows = await sql`
      SELECT
        id, name, mobile, nid, address,
        vehicle_type     AS "vehicleType",
        monthly_rent     AS "monthlyRent",
        rent_due_day     AS "rentDueDay",
        security_deposit AS "securityDeposit",
        status, notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tenants WHERE id = ${id} AND garage_id = ${garageId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0] as Tenant,
    } satisfies ApiResponse<Tenant>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── PUT /api/tenants/[id] ──────────────────────────────────
export const PUT = withWriteAuthRoute(async (
  request: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/tenants/[id]'>).params;
    const body = await request.json();
    const { name, mobile, nid, address, vehicleType, monthlyRent, rentDueDay, securityDeposit, status, notes } = body;

    const rows = await sql`
      UPDATE tenants SET
        name             = COALESCE(${name ?? null}, name),
        mobile           = COALESCE(${mobile ?? null}, mobile),
        nid              = COALESCE(${nid ?? null}, nid),
        address          = COALESCE(${address ?? null}, address),
        vehicle_type     = COALESCE(${vehicleType ?? null}, vehicle_type),
        monthly_rent     = COALESCE(${monthlyRent != null ? Number(monthlyRent) : null}, monthly_rent),
        rent_due_day     = COALESCE(${rentDueDay != null ? Number(rentDueDay) : null}, rent_due_day),
        security_deposit = COALESCE(${securityDeposit != null ? Number(securityDeposit) : null}, security_deposit),
        status           = COALESCE(${status ?? null}, status),
        notes            = COALESCE(${notes ?? null}, notes),
        updated_at       = now()
      WHERE id = ${id} AND garage_id = ${garageId}
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

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0] as Tenant,
    } satisfies ApiResponse<Tenant>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tenant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── DELETE /api/tenants/[id] ───────────────────────────────
export const DELETE = withAdminAuthRoute(async (
  _req: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/tenants/[id]'>).params;
    const rows = await sql`DELETE FROM tenants WHERE id = ${id} AND garage_id = ${garageId} RETURNING id`;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete tenant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
