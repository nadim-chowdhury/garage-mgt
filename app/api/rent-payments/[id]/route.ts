import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withWriteAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, RentPayment } from '@/types';

// ── PUT /api/rent-payments/[id] ────────────────────────────
export const PUT = withWriteAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const body = await request.json();
      const { paidAmount, paymentMethod, notes, receiptNumber, paymentDate } = body;

      // Fetch existing record to re-calculate due
      const existing = await sql`
        SELECT rent_amount, paid_amount FROM rent_payments
        WHERE id = ${id} AND garage_id = ${garageId}
      `;
      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Payment record not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const rentAmount = Number(existing[0].rent_amount) || 0;
      const newPaid = paidAmount !== undefined ? Number(paidAmount) || 0 : Number(existing[0].paid_amount) || 0;
      const dueAmount = Math.max(0, rentAmount - newPaid);

      let paymentStatus: RentPayment['paymentStatus'] = 'unpaid';
      if (newPaid >= rentAmount && rentAmount > 0) {
        paymentStatus = 'paid';
      } else if (newPaid > 0) {
        paymentStatus = 'partial';
      }

      const rows = await sql`
        UPDATE rent_payments
        SET
          paid_amount    = ${newPaid},
          due_amount     = ${dueAmount},
          payment_status = ${paymentStatus},
          payment_method = COALESCE(${paymentMethod}, payment_method),
          payment_date   = COALESCE(${paymentDate}, payment_date),
          receipt_number = COALESCE(${receiptNumber}, receipt_number),
          notes          = COALESCE(${notes}, notes),
          updated_at     = NOW()
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING
          id,
          tenant_id      AS "tenantId",
          rent_month     AS "rentMonth",
          rent_year      AS "rentYear",
          rent_amount    AS "rentAmount",
          paid_amount    AS "paidAmount",
          due_amount     AS "dueAmount",
          payment_method AS "paymentMethod",
          payment_status AS "paymentStatus",
          payment_date   AS "paymentDate",
          due_date       AS "dueDate",
          receipt_number AS "receiptNumber",
          notes,
          created_at     AS "createdAt",
          updated_at     AS "updatedAt"
      `;

      const updated = rows[0] as RentPayment;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'update',
        entityType: 'rent_payment',
        entityId: id,
        details: `Updated rent payment for period ${updated.rentMonth}/${updated.rentYear} (Paid: ৳${updated.paidAmount})`,
      });

      return NextResponse.json({
        success: true,
        data: updated,
      } satisfies ApiResponse<RentPayment>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update rent payment';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

// ── DELETE /api/rent-payments/[id] ─────────────────────────
export const DELETE = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const rows = await sql`
        DELETE FROM rent_payments
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING id, rent_month AS "rentMonth", rent_year AS "rentYear"
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Payment record not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'delete',
        entityType: 'rent_payment',
        entityId: id,
        details: `Deleted rent payment for period ${rows[0].rentMonth}/${rows[0].rentYear}`,
      });

      return NextResponse.json({
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete rent payment';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

