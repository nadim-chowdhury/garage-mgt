import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

// ── GET /api/backup (Download Full Garage Backup) ───────────
export const GET = withAdminAuth(async (_request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const [garage] = await sql`SELECT id, name, address, phone, created_at AS "createdAt" FROM garages WHERE id = ${garageId}`;
    const tenants = await sql`
      SELECT id, name, mobile, nid, address, vehicle_type AS "vehicleType",
        monthly_rent AS "monthlyRent", rent_due_day AS "rentDueDay",
        security_deposit AS "securityDeposit", status, notes, created_at AS "createdAt"
      FROM tenants WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const vehicles = await sql`
      SELECT id, tenant_id AS "tenantId", vehicle_number AS "vehicleNumber",
        vehicle_type AS "vehicleType", owner_name AS "ownerName",
        owner_mobile AS "ownerMobile", driver_name AS "driverName",
        driver_mobile AS "driverMobile", status, notes, created_at AS "createdAt"
      FROM vehicles WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const dailyEntries = await sql`
      SELECT id, vehicle_number AS "vehicleNumber", vehicle_type AS "vehicleType",
        owner_name AS "ownerName", owner_mobile AS "ownerMobile",
        driver_name AS "driverName", charge_amount AS "chargeAmount",
        paid_amount AS "paidAmount", payment_method AS "paymentMethod",
        payment_status AS "paymentStatus", notes, entry_date AS "entryDate",
        entry_time AS "entryTime", exit_time AS "exitTime", created_at AS "createdAt"
      FROM daily_vehicle_entries WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const rentPayments = await sql`
      SELECT id, tenant_id AS "tenantId", rent_month AS "rentMonth",
        rent_year AS "rentYear", rent_amount AS "rentAmount",
        paid_amount AS "paidAmount", due_amount AS "dueAmount",
        payment_method AS "paymentMethod", payment_status AS "paymentStatus",
        payment_date AS "paymentDate", due_date AS "dueDate",
        receipt_number AS "receiptNumber", notes, created_at AS "createdAt"
      FROM rent_payments WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const incomeEntries = await sql`
      SELECT id, tenant_id AS "tenantId", vehicle_id AS "vehicleId",
        daily_entry_id AS "dailyEntryId", income_date AS "incomeDate",
        category, amount, payment_method AS "paymentMethod",
        receipt_number AS "receiptNumber", notes, created_at AS "createdAt"
      FROM income_entries WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const expenseEntries = await sql`
      SELECT id, expense_date AS "expenseDate", category, description,
        amount, payment_method AS "paymentMethod", receipt_number AS "receiptNumber",
        notes, created_at AS "createdAt"
      FROM expense_entries WHERE garage_id = ${garageId} ORDER BY created_at ASC
    `;
    const dailyClosings = await sql`
      SELECT id, closing_date AS "closingDate", opening_balance AS "openingBalance",
        total_income AS "totalIncome", total_expense AS "totalExpense",
        closing_balance AS "closingBalance", actual_cash_counted AS "actualCashCounted",
        cash_difference AS "cashDifference", notes, closed_at AS "closedAt", status
      FROM daily_closings WHERE garage_id = ${garageId} ORDER BY closing_date ASC
    `;
    const periodClosings = await sql`
      SELECT id, closing_type AS "closingType", period_month AS "periodMonth",
        period_year AS "periodYear", total_income AS "totalIncome",
        total_expense AS "totalExpense", net_profit AS "netProfit",
        closing_cash_balance AS "closingCashBalance", notes, closed_at AS "closedAt", status
      FROM period_closings WHERE garage_id = ${garageId} ORDER BY period_year ASC, period_month ASC NULLS FIRST
    `;

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      garage,
      tenants,
      vehicles,
      dailyEntries,
      rentPayments,
      incomeEntries,
      expenseEntries,
      dailyClosings,
      periodClosings,
    };

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'create',
      entityType: 'backup',
      details: `Generated full garage data backup (${tenants.length} tenants, ${vehicles.length} vehicles, ${dailyEntries.length} daily entries, ${incomeEntries.length} income, ${expenseEntries.length} expenses)`,
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `garage-backup-${(garage?.name || 'garage').toLowerCase().replace(/\s+/g, '-')}-${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

// ── POST /api/backup/restore (Restore from JSON Backup) ─────
export const POST = withAdminAuth(async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
  try {
    const backup = await request.json();

    if (!backup || !backup.version || !backup.tenants || !backup.incomeEntries) {
      return NextResponse.json(
        { success: false, error: 'অবৈধ ব্যাকআপ ফাইল। ফাইলটি সম্পূর্ণ বা সঠিক ফরম্যাটে নেই।' },
        { status: 400 },
      );
    }

    // Safely restore data inside SQL statements
    // 1. Restore Tenants
    for (const t of backup.tenants || []) {
      await sql`
        INSERT INTO tenants
          (id, garage_id, name, mobile, nid, address, vehicle_type,
           monthly_rent, rent_due_day, security_deposit, status, notes)
        VALUES
          (${t.id}, ${garageId}, ${t.name}, ${t.mobile}, ${t.nid || ''}, ${t.address || ''},
           ${t.vehicleType || 'other'}, ${Number(t.monthlyRent) || 0}, ${Number(t.rentDueDay) || 1},
           ${Number(t.securityDeposit) || 0}, ${t.status || 'active'}, ${t.notes || ''})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          mobile = EXCLUDED.mobile,
          monthly_rent = EXCLUDED.monthly_rent,
          status = EXCLUDED.status
      `;
    }

    // 2. Restore Vehicles
    for (const v of backup.vehicles || []) {
      await sql`
        INSERT INTO vehicles
          (id, garage_id, tenant_id, vehicle_number, vehicle_type, owner_name, owner_mobile, status, notes)
        VALUES
          (${v.id}, ${garageId}, ${v.tenantId || null}, ${v.vehicleNumber}, ${v.vehicleType || 'other'},
           ${v.ownerName || ''}, ${v.ownerMobile || ''}, ${v.status || 'active'}, ${v.notes || ''})
        ON CONFLICT (id) DO UPDATE SET
          vehicle_number = EXCLUDED.vehicle_number,
          status = EXCLUDED.status
      `;
    }

    await logAudit({
      garageId,
      userId,
      userName,
      action: 'update',
      entityType: 'backup',
      details: `Restored backup data from export dated ${backup.exportedAt || 'unknown'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'ব্যাকআপ ডাটা সফলভাবে রিস্টোর করা হয়েছে।',
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup restoration failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
