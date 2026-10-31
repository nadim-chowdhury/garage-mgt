import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';

export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const category = searchParams.get('category') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`garage_id = $1`];
    const params: unknown[] = [garageId];

    if (startDate) { params.push(startDate); conditions.push(`expense_date >= $${params.length}`); }
    if (endDate) { params.push(endDate); conditions.push(`expense_date <= $${params.length}`); }
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM expense_entries ${where}`, params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        id, expense_date AS "expenseDate",
        category, description, amount,
        payment_method  AS "paymentMethod",
        receipt_number  AS "receiptNumber",
        notes,
        created_at AS "createdAt"
      FROM expense_entries
      ${where}
      ORDER BY expense_date DESC, created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return NextResponse.json({
      success: true, data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch expenses';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const POST = withWriteAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const body = await request.json();
    const { expenseDate, category, description, amount, paymentMethod, receiptNumber, notes } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO expense_entries
        (garage_id, expense_date, category, description, amount, payment_method, receipt_number, notes)
      VALUES
        (${garageId}, ${expenseDate ?? new Date().toISOString().split('T')[0]},
         ${category ?? 'other'}, ${description ?? ''},
         ${Number(amount)}, ${paymentMethod ?? 'cash'},
         ${receiptNumber ?? ''}, ${notes ?? ''})
      RETURNING
        id, expense_date AS "expenseDate",
        category, description, amount,
        payment_method AS "paymentMethod",
        receipt_number AS "receiptNumber",
        notes, created_at AS "createdAt"
    `;

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create expense';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
