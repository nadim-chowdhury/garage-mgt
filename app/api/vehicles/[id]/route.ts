import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuthRoute, withWriteAuthRoute, withAdminAuthRoute } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';

export const GET = withAuthRoute(async (
  _req: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/vehicles/[id]'>).params;

    const rows = await sql`
      SELECT
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
      FROM vehicles WHERE id = ${id} AND garage_id = ${garageId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vehicle';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const PUT = withWriteAuthRoute(async (
  request: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/vehicles/[id]'>).params;
    const body = await request.json();
    const { tenantId, vehicleNumber, vehicleType, ownerName, ownerMobile, driverName, driverMobile, notes, status } = body;

    const rows = await sql`
      UPDATE vehicles SET
        tenant_id      = COALESCE(${tenantId ?? null}, tenant_id),
        vehicle_number = COALESCE(${vehicleNumber ?? null}, vehicle_number),
        vehicle_type   = COALESCE(${vehicleType ?? null}, vehicle_type),
        owner_name     = COALESCE(${ownerName ?? null}, owner_name),
        owner_mobile   = COALESCE(${ownerMobile ?? null}, owner_mobile),
        driver_name    = COALESCE(${driverName ?? null}, driver_name),
        driver_mobile  = COALESCE(${driverMobile ?? null}, driver_mobile),
        notes          = COALESCE(${notes ?? null}, notes),
        status         = COALESCE(${status ?? null}, status),
        updated_at     = now()
      WHERE id = ${id} AND garage_id = ${garageId}
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

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update vehicle';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const DELETE = withAdminAuthRoute(async (
  _req: NextRequest,
  routeCtx: unknown,
  { garageId },
) => {
  try {
    const { id } = await (routeCtx as RouteContext<'/api/vehicles/[id]'>).params;
    const rows = await sql`DELETE FROM vehicles WHERE id = ${id} AND garage_id = ${garageId} RETURNING id`;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete vehicle';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
