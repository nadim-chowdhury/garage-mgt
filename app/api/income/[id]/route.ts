import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withWriteAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, IncomeEntry } from '@/types';

// ── PUT /api/income/[id] ───────────────────────────────────
export const PUT = withWriteAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const body = await request.json();
      const { tenantId, incomeDate, category, amount, paymentMethod, receiptNumber, notes } = body;

      const numAmount = Number(amount) || 0;

      const rows = await sql`
        UPDATE income_entries
        SET
          tenant_id      = ${tenantId || null},
          income_date    = COALESCE(${incomeDate}, income_date),
          category       = COALESCE(${category}, category),
          amount         = ${numAmount},
          payment_method = COALESCE(${paymentMethod}, payment_method),
          receipt_number = COALESCE(${receiptNumber}, receipt_number),
          notes          = COALESCE(${notes}, notes)
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING
          id,
          tenant_id      AS "tenantId",
          vehicle_id     AS "vehicleId",
          daily_entry_id AS "dailyEntryId",
          income_date    AS "incomeDate",
          category,
          amount,
          payment_method AS "paymentMethod",
          receipt_number AS "receiptNumber",
          notes,
          created_at     AS "createdAt"
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Income entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const updated = rows[0] as IncomeEntry;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'update',
        entityType: 'income',
        entityId: id,
        details: `Updated income entry: ${updated.category} (৳${updated.amount})`,
      });

      return NextResponse.json({
        success: true,
        data: updated,
      } satisfies ApiResponse<IncomeEntry>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update income entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

// ── DELETE /api/income/[id] ────────────────────────────────
export const DELETE = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const rows = await sql`
        DELETE FROM income_entries
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING id, category, amount
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Income entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'delete',
        entityType: 'income',
        entityId: id,
        details: `Deleted income entry: ${rows[0].category} (৳${rows[0].amount})`,
      });

      return NextResponse.json({
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete income entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

