import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/api-auth';

export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    // Today's income
    const incomeRows = await sql`
      SELECT
        id, income_date AS "incomeDate", category, amount,
        payment_method AS "paymentMethod",
        receipt_number AS "receiptNumber", notes,
        created_at AS "createdAt"
      FROM income_entries
      WHERE income_date = ${date} AND garage_id = ${garageId}
      ORDER BY created_at ASC
    `;

    // Today's expenses
    const expenseRows = await sql`
      SELECT
        id, expense_date AS "expenseDate", category, description, amount,
        payment_method AS "paymentMethod",
        receipt_number AS "receiptNumber", notes,
        created_at AS "createdAt"
      FROM expense_entries
      WHERE expense_date = ${date} AND garage_id = ${garageId}
      ORDER BY created_at ASC
    `;

    const totalIncome = incomeRows.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpense = expenseRows.reduce((sum, r) => sum + Number(r.amount), 0);

    // Previous day's closing balance as today's opening
    const prevResult = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS balance
      FROM (
        SELECT amount, 'income' AS type FROM income_entries WHERE income_date < ${date} AND garage_id = ${garageId}
        UNION ALL
        SELECT amount, 'expense' AS type FROM expense_entries WHERE expense_date < ${date} AND garage_id = ${garageId}
      ) t
    `;
    const openingBalance = Number(prevResult[0]?.balance ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        date,
        openingBalance,
        totalIncome,
        totalExpense,
        closingBalance: openingBalance + totalIncome - totalExpense,
        incomeEntries: incomeRows,
        expenseEntries: expenseRows,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cash book';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
