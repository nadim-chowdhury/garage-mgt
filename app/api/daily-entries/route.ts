import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withWriteAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

export const GET = withAuth(async (request: NextRequest, { garageId }: AuthContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const date = searchParams.get('date') ?? '';
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [`garage_id = $1`];
    const params: unknown[] = [garageId];

    if (date) {
      params.push(date);
      conditions.push(`entry_date = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`payment_status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await sql.query(
      `SELECT COUNT(*)::int AS total FROM daily_vehicle_entries ${where}`,
      params,
    );
    const total: number = countResult[0]?.total ?? 0;

    params.push(limit, offset);
    const rows = await sql.query(
      `SELECT
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
      FROM daily_vehicle_entries
      ${where}
      ORDER BY entry_date DESC, entry_time DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch daily entries';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const POST = withWriteAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const body = await request.json();
    const {
      vehicleNumber, vehicleType, ownerName, ownerMobile, driverName,
      chargeAmount, paidAmount, paymentMethod, notes, entryDate, entryTime,
    } = body;

    if (!vehicleNumber) {
      return NextResponse.json({ success: false, error: 'Vehicle number is required' }, { status: 400 });
    }

    const charge = Number(chargeAmount) || 0;
    const paid = Number(paidAmount) || 0;
    let paymentStatus = 'unpaid';
    if (paid >= charge && charge > 0) paymentStatus = 'paid';
    else if (paid > 0) paymentStatus = 'partial';

    const rows = await sql`
      INSERT INTO daily_vehicle_entries
        (garage_id, vehicle_number, vehicle_type, owner_name, owner_mobile, driver_name,
         charge_amount, paid_amount, payment_method, payment_status, notes,
         entry_date, entry_time)
      VALUES
        (${garageId}, ${vehicleNumber}, ${vehicleType ?? 'other'}, ${ownerName ?? ''},
         ${ownerMobile ?? ''}, ${driverName ?? ''},
         ${charge}, ${paid}, ${paymentMethod ?? 'cash'}, ${paymentStatus},
         ${notes ?? ''}, ${entryDate ?? new Date().toISOString().split('T')[0]},
         ${entryTime ?? new Date().toTimeString().split(' ')[0]})
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
        notes, entry_date AS "entryDate",
        entry_time AS "entryTime",
        exit_time  AS "exitTime",
        created_at AS "createdAt"
    `;

    // Auto-create income entry if paid > 0
    const entry = rows[0];
    if (paid > 0) {
      await sql`
        INSERT INTO income_entries
          (garage_id, daily_entry_id, income_date, category, amount, payment_method, notes)
        VALUES
          (${garageId}, ${entry.id}, ${entry.entryDate}, 'daily_vehicle_charge',
           ${paid}, ${paymentMethod ?? 'cash'},
           ${'Daily vehicle charge: ' + vehicleNumber})
      `;
    }

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'daily_entry',
      entityId: entry.id,
      details: `Created daily entry for ${vehicleNumber} (Paid: ৳${paid}/${charge})`,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create daily entry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
