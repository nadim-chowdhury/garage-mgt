import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

// ── GET /api/closings/day?date=YYYY-MM-DD ──────────────────
export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const rows = await sql`
      SELECT
        id, garage_id AS "garageId", closing_date AS "closingDate",
        opening_balance AS "openingBalance", total_income AS "totalIncome",
        total_expense AS "totalExpense", closing_balance AS "closingBalance",
        actual_cash_counted AS "actualCashCounted", cash_difference AS "cashDifference",
        notes, closed_by_user_id AS "closedByUserId", closed_at AS "closedAt",
        status
      FROM daily_closings
      WHERE garage_id = ${garageId} AND closing_date = ${date}
    `;

    return NextResponse.json({
      success: true,
      data: rows[0] ?? null,
      isClosed: rows.length > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch day closing status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── POST /api/closings/day (Execute Day End Closing) ───────
export const POST = withWriteAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const body = await request.json();
      const { closingDate, actualCashCounted, notes } = body;

      const date = closingDate ?? new Date().toISOString().split('T')[0];

      // Check if already closed
      const existing = await sql`
        SELECT id FROM daily_closings
        WHERE garage_id = ${garageId} AND closing_date = ${date}
      `;
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: `Day end closing for ${date} has already been completed.` },
          { status: 400 },
        );
      }

      // Calculate Day Financials
      const [incomeRow] = await sql`
        SELECT COALESCE(SUM(amount), 0)::numeric AS total
        FROM income_entries
        WHERE garage_id = ${garageId} AND income_date = ${date}
      `;
      const [expenseRow] = await sql`
        SELECT COALESCE(SUM(amount), 0)::numeric AS total
        FROM expense_entries
        WHERE garage_id = ${garageId} AND expense_date = ${date}
      `;

      // Opening balance is net balance before this date
      const [prevResult] = await sql`
        SELECT
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS balance
        FROM (
          SELECT amount, 'income' AS type FROM income_entries WHERE income_date < ${date} AND garage_id = ${garageId}
          UNION ALL
          SELECT amount, 'expense' AS type FROM expense_entries WHERE expense_date < ${date} AND garage_id = ${garageId}
        ) t
      `;

      const openingBalance = Number(prevResult?.balance ?? 0);
      const totalIncome = Number(incomeRow?.total ?? 0);
      const totalExpense = Number(expenseRow?.total ?? 0);
      const expectedClosing = openingBalance + totalIncome - totalExpense;

      const actualCash = actualCashCounted !== undefined && actualCashCounted !== null && actualCashCounted !== ''
        ? Number(actualCashCounted)
        : expectedClosing;
      const cashDifference = actualCash - expectedClosing;

      const rows = await sql`
        INSERT INTO daily_closings
          (garage_id, closing_date, opening_balance, total_income, total_expense,
           closing_balance, actual_cash_counted, cash_difference, notes,
           closed_by_user_id, status)
        VALUES
          (${garageId}, ${date}, ${openingBalance}, ${totalIncome}, ${totalExpense},
           ${expectedClosing}, ${actualCash}, ${cashDifference}, ${notes ?? ''},
           ${userId}, 'closed')
        RETURNING
          id, garage_id AS "garageId", closing_date AS "closingDate",
          opening_balance AS "openingBalance", total_income AS "totalIncome",
          total_expense AS "totalExpense", closing_balance AS "closingBalance",
          actual_cash_counted AS "actualCashCounted", cash_difference AS "cashDifference",
          notes, closed_by_user_id AS "closedByUserId", closed_at AS "closedAt",
          status
      `;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'create',
        entityType: 'daily_closing',
        entityId: rows[0].id,
        details: `Day End Closing for ${date} (Expected: ৳${expectedClosing}, Actual: ৳${actualCash}, Diff: ৳${cashDifference})`,
      });

      // Calculate next business date
      const nextDate = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];

      return NextResponse.json({
        success: true,
        data: rows[0],
        nextDate,
        message: `Day end closing completed for ${date}. Next working day: ${nextDate}`,
      }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Day end closing failed';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  },
);
