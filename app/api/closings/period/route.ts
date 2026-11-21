import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

// ── GET /api/closings/period?type=month&year=2026&month=11 ─
export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') ?? 'month';
    const year = Number(searchParams.get('year') ?? new Date().getFullYear());
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : null;

    const rows = await sql`
      SELECT
        id, garage_id AS "garageId", closing_type AS "closingType",
        period_month AS "periodMonth", period_year AS "periodYear",
        total_income AS "totalIncome", total_expense AS "totalExpense",
        net_profit AS "netProfit", closing_cash_balance AS "closingCashBalance",
        notes, closed_by_user_id AS "closedByUserId", closed_at AS "closedAt",
        status
      FROM period_closings
      WHERE garage_id = ${garageId} AND closing_type = ${type}
        AND period_year = ${year}
        AND ((${month}::int IS NULL AND period_month IS NULL) OR period_month = ${month})
    `;

    // Also get all closed periods for this year
    const allClosed = await sql`
      SELECT id, closing_type AS "closingType", period_month AS "periodMonth",
        period_year AS "periodYear", total_income AS "totalIncome",
        total_expense AS "totalExpense", net_profit AS "netProfit",
        closed_at AS "closedAt", status
      FROM period_closings
      WHERE garage_id = ${garageId} AND period_year = ${year}
      ORDER BY period_month DESC NULLS FIRST
    `;

    return NextResponse.json({
      success: true,
      data: rows[0] ?? null,
      isClosed: rows.length > 0,
      allClosed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch period closing status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── POST /api/closings/period (Admin Only: Close Month / Year)
export const POST = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const body = await request.json();
      const { closingType, periodMonth, periodYear, notes } = body;

      const type = closingType === 'year' ? 'year' : 'month';
      const year = Number(periodYear) || new Date().getFullYear();
      const month = type === 'month' ? (Number(periodMonth) || (new Date().getMonth() + 1)) : null;

      // Check if already closed
      const existing = await sql`
        SELECT id FROM period_closings
        WHERE garage_id = ${garageId} AND closing_type = ${type}
          AND period_year = ${year}
          AND ((${month}::int IS NULL AND period_month IS NULL) OR period_month = ${month})
      `;
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: `Period closing for ${type === 'month' ? `${month}/${year}` : `${year}`} has already been completed.` },
          { status: 400 },
        );
      }

      // Calculate period date boundaries
      let startDateStr: string;
      let endDateStr: string;

      if (type === 'month' && month) {
        const lastDay = new Date(year, month, 0).getDate();
        startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        startDateStr = `${year}-01-01`;
        endDateStr = `${year}-12-31`;
      }

      const [incomeRow] = await sql`
        SELECT COALESCE(SUM(amount), 0)::numeric AS total
        FROM income_entries
        WHERE garage_id = ${garageId} AND income_date BETWEEN ${startDateStr} AND ${endDateStr}
      `;
      const [expenseRow] = await sql`
        SELECT COALESCE(SUM(amount), 0)::numeric AS total
        FROM expense_entries
        WHERE garage_id = ${garageId} AND expense_date BETWEEN ${startDateStr} AND ${endDateStr}
      `;

      // Cumulative closing balance up to end of this period
      const [cashRow] = await sql`
        SELECT
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS balance
        FROM (
          SELECT amount, 'income' AS type FROM income_entries WHERE income_date <= ${endDateStr} AND garage_id = ${garageId}
          UNION ALL
          SELECT amount, 'expense' AS type FROM expense_entries WHERE expense_date <= ${endDateStr} AND garage_id = ${garageId}
        ) t
      `;

      const totalIncome = Number(incomeRow?.total ?? 0);
      const totalExpense = Number(expenseRow?.total ?? 0);
      const netProfit = totalIncome - totalExpense;
      const closingCashBalance = Number(cashRow?.balance ?? 0);

      const rows = await sql`
        INSERT INTO period_closings
          (garage_id, closing_type, period_month, period_year,
           total_income, total_expense, net_profit, closing_cash_balance,
           notes, closed_by_user_id, status)
        VALUES
          (${garageId}, ${type}, ${month}, ${year},
           ${totalIncome}, ${totalExpense}, ${netProfit}, ${closingCashBalance},
           ${notes ?? ''}, ${userId}, 'closed')
        RETURNING
          id, garage_id AS "garageId", closing_type AS "closingType",
          period_month AS "periodMonth", period_year AS "periodYear",
          total_income AS "totalIncome", total_expense AS "totalExpense",
          net_profit AS "netProfit", closing_cash_balance AS "closingCashBalance",
          notes, closed_by_user_id AS "closedByUserId", closed_at AS "closedAt",
          status
      `;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'create',
        entityType: 'period_closing',
        entityId: rows[0].id,
        details: `${type === 'month' ? `Month End (${month}/${year})` : `Year End (${year})`} Closed. Income: ৳${totalIncome}, Expense: ৳${totalExpense}, Net Profit: ৳${netProfit}`,
      });

      return NextResponse.json({
        success: true,
        data: rows[0],
        message: `Period closing completed successfully for ${type === 'month' ? `${month}/${year}` : `${year}`}.`,
      }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Period closing failed';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  },
);
