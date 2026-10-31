import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withWriteAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, DailyVehicleEntry } from '@/types';

// ── PUT /api/daily-entries/[id] ────────────────────────────
export const PUT = withWriteAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const body = await request.json();
      const {
        vehicleNumber,
        vehicleType,
        ownerName,
        ownerMobile,
        driverName,
        chargeAmount,
        paidAmount,
        paymentMethod,
        notes,
        entryDate,
        entryTime,
        exitTime,
      } = body;

      const charge = Number(chargeAmount) || 0;
      const paid = Number(paidAmount) || 0;

      let paymentStatus: DailyVehicleEntry['paymentStatus'] = 'unpaid';
      if (paid >= charge && charge > 0) {
        paymentStatus = 'paid';
      } else if (paid > 0) {
        paymentStatus = 'partial';
      }

      const rows = await sql`
        UPDATE daily_vehicle_entries
        SET
          vehicle_number = COALESCE(${vehicleNumber}, vehicle_number),
          vehicle_type   = COALESCE(${vehicleType}, vehicle_type),
          owner_name     = COALESCE(${ownerName}, owner_name),
          owner_mobile   = COALESCE(${ownerMobile}, owner_mobile),
          driver_name    = COALESCE(${driverName}, driver_name),
          charge_amount  = ${charge},
          paid_amount    = ${paid},
          payment_method = COALESCE(${paymentMethod}, payment_method),
          payment_status = ${paymentStatus},
          notes          = COALESCE(${notes}, notes),
          entry_date     = COALESCE(${entryDate}, entry_date),
          entry_time     = COALESCE(${entryTime}, entry_time),
          exit_time      = ${exitTime ?? null}
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING
          id, vehicle_number AS "vehicleNumber",
          vehicle_type    AS "vehicleType",
          owner_name      AS "ownerName",
          owner_mobile    AS "ownerMobile",
          driver_name     AS "driverName",
          charge_amount   AS "chargeAmount",
          paid_amount     AS "paidAmount",
          payment_method  AS "paymentMethod",
          payment_status  AS "paymentStatus",
          notes,
          entry_date AS "entryDate",
          entry_time AS "entryTime",
          exit_time  AS "exitTime",
          created_at AS "createdAt"
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const updated = rows[0] as DailyVehicleEntry;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'update',
        entityType: 'daily_entry',
        entityId: id,
        details: `Updated entry for ${updated.vehicleNumber} (Paid: ৳${updated.paidAmount}/${updated.chargeAmount})`,
      });

      return NextResponse.json({
        success: true,
        data: updated,
      } satisfies ApiResponse<DailyVehicleEntry>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

// ── DELETE /api/daily-entries/[id] ─────────────────────────
export const DELETE = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const rows = await sql`
        DELETE FROM daily_vehicle_entries
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING id, vehicle_number AS "vehicleNumber"
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'delete',
        entityType: 'daily_entry',
        entityId: id,
        details: `Deleted daily entry for ${rows[0].vehicleNumber}`,
      });

      return NextResponse.json({
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);
