import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withWriteAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, ExpenseEntry } from '@/types';

// ── PUT /api/expenses/[id] ─────────────────────────────────
export const PUT = withWriteAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const body = await request.json();
      const { expenseDate, category, description, amount, paymentMethod, receiptNumber, notes } = body;

      const numAmount = Number(amount) || 0;

      const rows = await sql`
        UPDATE expense_entries
        SET
          expense_date   = COALESCE(${expenseDate}, expense_date),
          category       = COALESCE(${category}, category),
          description    = COALESCE(${description}, description),
          amount         = ${numAmount},
          payment_method = COALESCE(${paymentMethod}, payment_method),
          receipt_number = COALESCE(${receiptNumber}, receipt_number),
          notes          = COALESCE(${notes}, notes)
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING
          id,
          expense_date   AS "expenseDate",
          category,
          description,
          amount,
          payment_method AS "paymentMethod",
          receipt_number AS "receiptNumber",
          notes,
          created_at     AS "createdAt"
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Expense entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const updated = rows[0] as ExpenseEntry;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'update',
        entityType: 'expense',
        entityId: id,
        details: `Updated expense entry: ${updated.category} (৳${updated.amount})`,
      });

      return NextResponse.json({
        success: true,
        data: updated,
      } satisfies ApiResponse<ExpenseEntry>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update expense entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

// ── DELETE /api/expenses/[id] ──────────────────────────────
export const DELETE = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop() ?? '';

      const rows = await sql`
        DELETE FROM expense_entries
        WHERE id = ${id} AND garage_id = ${garageId}
        RETURNING id, category, amount
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Expense entry not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'delete',
        entityType: 'expense',
        entityId: id,
        details: `Deleted expense entry: ${rows[0].category} (৳${rows[0].amount})`,
      });

      return NextResponse.json({
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete expense entry';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

