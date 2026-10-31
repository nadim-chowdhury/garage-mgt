import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const category = searchParams.get('category') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`ie.garage_id = $1`];
    const params: unknown[] = [garageId];

    if (startDate) { params.push(startDate); conditions.push(`ie.income_date >= $${params.length}`); }
    if (endDate) { params.push(endDate); conditions.push(`ie.income_date <= $${params.length}`); }
    if (category) { params.push(category); conditions.push(`ie.category = $${params.length}`); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM income_entries ie ${where}`, params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        ie.id, ie.tenant_id AS "tenantId",
        ie.vehicle_id   AS "vehicleId",
        ie.daily_entry_id AS "dailyEntryId",
        ie.income_date  AS "incomeDate",
        ie.category, ie.amount,
        ie.payment_method AS "paymentMethod",
        ie.receipt_number AS "receiptNumber",
        ie.notes,
        ie.created_at AS "createdAt",
        t.name AS "tenantName"
      FROM income_entries ie
      LEFT JOIN tenants t ON t.id = ie.tenant_id
      ${where}
      ORDER BY ie.income_date DESC, ie.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return NextResponse.json({
      success: true, data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch income entries';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const POST = withWriteAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const body = await request.json();
    const { tenantId, vehicleId, incomeDate, category, amount, paymentMethod, receiptNumber, notes } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO income_entries
        (garage_id, tenant_id, vehicle_id, income_date, category, amount, payment_method, receipt_number, notes)
      VALUES
        (${garageId}, ${tenantId ?? null}, ${vehicleId ?? null},
         ${incomeDate ?? new Date().toISOString().split('T')[0]},
         ${category ?? 'other'}, ${Number(amount)},
         ${paymentMethod ?? 'cash'}, ${receiptNumber ?? ''}, ${notes ?? ''})
      RETURNING
        id, tenant_id AS "tenantId", vehicle_id AS "vehicleId",
        daily_entry_id AS "dailyEntryId",
        income_date AS "incomeDate", category, amount,
        payment_method AS "paymentMethod",
        receipt_number AS "receiptNumber",
        notes, created_at AS "createdAt"
    `;

    const entry = rows[0];

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'income',
      entityId: entry.id,
      details: `Created income entry: ${entry.category} (৳${entry.amount})`,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create income entry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
