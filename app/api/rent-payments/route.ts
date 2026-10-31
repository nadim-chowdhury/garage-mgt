import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const tenantId = searchParams.get('tenantId') ?? '';
    const month = searchParams.get('month') ?? '';
    const year = searchParams.get('year') ?? '';
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`rp.garage_id = $1`];
    const params: unknown[] = [garageId];

    if (tenantId) { params.push(tenantId); conditions.push(`rp.tenant_id = $${params.length}`); }
    if (month) { params.push(Number(month)); conditions.push(`rp.rent_month = $${params.length}`); }
    if (year) { params.push(Number(year)); conditions.push(`rp.rent_year = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`rp.payment_status = $${params.length}`); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM rent_payments rp ${where}`,
      params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
        rp.id, rp.tenant_id AS "tenantId",
        rp.rent_month    AS "rentMonth",
        rp.rent_year     AS "rentYear",
        rp.rent_amount   AS "rentAmount",
        rp.paid_amount   AS "paidAmount",
        rp.due_amount    AS "dueAmount",
        rp.payment_method  AS "paymentMethod",
        rp.payment_status  AS "paymentStatus",
        rp.payment_date  AS "paymentDate",
        rp.due_date      AS "dueDate",
        rp.receipt_number AS "receiptNumber",
        rp.notes,
        rp.created_at AS "createdAt",
        rp.updated_at AS "updatedAt",
        t.name AS "tenantName",
        t.mobile AS "tenantMobile",
        t.vehicle_type AS "tenantVehicleType"
      FROM rent_payments rp
      JOIN tenants t ON t.id = rp.tenant_id
      ${where}
      ORDER BY rp.rent_year DESC, rp.rent_month DESC, t.name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return NextResponse.json({
      success: true, data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rent payments';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const POST = withWriteAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const body = await request.json();
    const { tenantId, rentMonth, rentYear, rentAmount, paidAmount, paymentMethod, dueDate, receiptNumber, notes } = body;

    if (!tenantId || !rentMonth || !rentYear) {
      return NextResponse.json({ success: false, error: 'Tenant, month, and year are required' }, { status: 400 });
    }

    const rent = Number(rentAmount) || 0;
    const paid = Number(paidAmount) || 0;
    const due = Math.max(0, rent - paid);
    let paymentStatus = 'unpaid';
    if (paid >= rent && rent > 0) paymentStatus = 'paid';
    else if (paid > 0) paymentStatus = 'partial';

    // Check overdue
    const dueDateStr = dueDate || `${rentYear}-${String(rentMonth).padStart(2, '0')}-01`;
    if (paymentStatus !== 'paid' && new Date(dueDateStr) < new Date()) {
      paymentStatus = 'overdue';
    }

    const rows = await sql`
      INSERT INTO rent_payments
        (garage_id, tenant_id, rent_month, rent_year, rent_amount, paid_amount, due_amount,
         payment_method, payment_status, payment_date, due_date, receipt_number, notes)
      VALUES
        (${garageId}, ${tenantId}, ${Number(rentMonth)}, ${Number(rentYear)}, ${rent}, ${paid}, ${due},
         ${paymentMethod ?? 'cash'}, ${paymentStatus},
         ${paid > 0 ? new Date().toISOString().split('T')[0] : null},
         ${dueDateStr}, ${receiptNumber ?? ''}, ${notes ?? ''})
      ON CONFLICT (tenant_id, rent_month, rent_year) DO UPDATE SET
        paid_amount    = rent_payments.paid_amount + ${paid},
        due_amount     = GREATEST(0, rent_payments.rent_amount - (rent_payments.paid_amount + ${paid})),
        payment_status = CASE
          WHEN (rent_payments.paid_amount + ${paid}) >= rent_payments.rent_amount THEN 'paid'
          WHEN (rent_payments.paid_amount + ${paid}) > 0 THEN 'partial'
          ELSE rent_payments.payment_status
        END,
        payment_method = ${paymentMethod ?? 'cash'},
        payment_date   = ${new Date().toISOString().split('T')[0]},
        receipt_number = COALESCE(NULLIF(${receiptNumber ?? ''}, ''), rent_payments.receipt_number),
        notes          = COALESCE(NULLIF(${notes ?? ''}, ''), rent_payments.notes),
        updated_at     = now()
      RETURNING
        id, tenant_id AS "tenantId",
        rent_month AS "rentMonth", rent_year AS "rentYear",
        rent_amount AS "rentAmount", paid_amount AS "paidAmount",
        due_amount AS "dueAmount", payment_method AS "paymentMethod",
        payment_status AS "paymentStatus", payment_date AS "paymentDate",
        due_date AS "dueDate", receipt_number AS "receiptNumber",
        notes, created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    // Auto-create income entry if paid > 0
    if (paid > 0) {
      await sql`
        INSERT INTO income_entries
          (garage_id, tenant_id, income_date, category, amount, payment_method, receipt_number, notes)
        VALUES
          (${garageId}, ${tenantId}, ${new Date().toISOString().split('T')[0]}, 'monthly_rent',
           ${paid}, ${paymentMethod ?? 'cash'}, ${receiptNumber ?? ''},
           ${'Rent payment: ' + rentMonth + '/' + rentYear})
      `;
    }

    const payment = rows[0];

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'rent_payment',
      entityId: payment.id,
      details: `Recorded rent payment for period ${rentMonth}/${rentYear} (Paid: ৳${paid})`,
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record rent payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
