import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/reports/[...slug]'>,
) {
  try {
    // Auth check
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }
    const garageId = session.garageId;

    const { slug } = await ctx.params;
    const reportType = slug.join('/');
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const tenantId = searchParams.get('tenantId') ?? '';
    const vehicleId = searchParams.get('vehicleId') ?? '';

    switch (reportType) {
      case 'tenant-ledger': return tenantLedger(tenantId, garageId);
      case 'vehicle-ledger': return vehicleLedger(vehicleId, garageId);
      case 'income-expense-summary': return incomeExpenseSummary(startDate, endDate, garageId);
      case 'profit-loss': return profitLoss(startDate, endDate, garageId);
      case 'payment-history': return paymentHistory(startDate, endDate, tenantId, garageId);
      case 'monthly-collection': return monthlyCollection(startDate, endDate, garageId);
      default:
        return NextResponse.json({ success: false, error: `Unknown report: ${reportType}` }, { status: 404 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── Tenant Ledger ──────────────────────────────────────────
async function tenantLedger(tenantId: string, garageId: string) {
  if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 });

  const tenant = await sql`SELECT id, name, mobile, monthly_rent AS "monthlyRent", security_deposit AS "securityDeposit" FROM tenants WHERE id = ${tenantId} AND garage_id = ${garageId}`;
  if (tenant.length === 0) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });

  const rentPayments = await sql`
    SELECT id, rent_month AS "rentMonth", rent_year AS "rentYear",
      rent_amount AS "rentAmount", paid_amount AS "paidAmount", due_amount AS "dueAmount",
      payment_status AS "paymentStatus", payment_date AS "paymentDate", payment_method AS "paymentMethod"
    FROM rent_payments WHERE tenant_id = ${tenantId} AND garage_id = ${garageId}
    ORDER BY rent_year DESC, rent_month DESC
  `;

  const incomeEntries = await sql`
    SELECT id, income_date AS "incomeDate", category, amount,
      payment_method AS "paymentMethod", receipt_number AS "receiptNumber", notes
    FROM income_entries WHERE tenant_id = ${tenantId} AND garage_id = ${garageId}
    ORDER BY income_date DESC
  `;

  const [summary] = await sql`
    SELECT
      COALESCE(SUM(rent_amount), 0)::numeric AS "totalRent",
      COALESCE(SUM(paid_amount), 0)::numeric AS "totalPaid",
      COALESCE(SUM(due_amount), 0)::numeric AS "totalDue"
    FROM rent_payments WHERE tenant_id = ${tenantId} AND garage_id = ${garageId}
  `;

  return NextResponse.json({
    success: true,
    data: { tenant: tenant[0], rentPayments, incomeEntries, summary },
  });
}

// ── Vehicle Ledger ─────────────────────────────────────────
async function vehicleLedger(vehicleId: string, garageId: string) {
  if (!vehicleId) return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });

  const vehicle = await sql`
    SELECT v.id, v.vehicle_number AS "vehicleNumber", v.vehicle_type AS "vehicleType",
      v.owner_name AS "ownerName", t.name AS "tenantName"
    FROM vehicles v LEFT JOIN tenants t ON t.id = v.tenant_id
    WHERE v.id = ${vehicleId} AND v.garage_id = ${garageId}
  `;
  if (vehicle.length === 0) return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });

  const incomeEntries = await sql`
    SELECT id, income_date AS "incomeDate", category, amount,
      payment_method AS "paymentMethod", notes
    FROM income_entries WHERE vehicle_id = ${vehicleId} AND garage_id = ${garageId}
    ORDER BY income_date DESC
  `;

  return NextResponse.json({ success: true, data: { vehicle: vehicle[0], incomeEntries } });
}

// ── Income vs Expense Summary ──────────────────────────────
async function incomeExpenseSummary(startDate: string, endDate: string, garageId: string) {
  const start = startDate || new Date().toISOString().slice(0, 7) + '-01';
  const end = endDate || new Date().toISOString().split('T')[0];

  const incomeByCategory = await sql`
    SELECT category, COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count
    FROM income_entries WHERE income_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId}
    GROUP BY category ORDER BY total DESC
  `;

  const expenseByCategory = await sql`
    SELECT category, COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count
    FROM expense_entries WHERE expense_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId}
    GROUP BY category ORDER BY total DESC
  `;

  const [totals] = await sql`
    SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM income_entries WHERE income_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId})::numeric AS "totalIncome",
      (SELECT COALESCE(SUM(amount), 0) FROM expense_entries WHERE expense_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId})::numeric AS "totalExpense"
  `;

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate: start, endDate: end },
      incomeByCategory, expenseByCategory,
      totalIncome: Number(totals.totalIncome),
      totalExpense: Number(totals.totalExpense),
      netProfit: Number(totals.totalIncome) - Number(totals.totalExpense),
    },
  });
}

// ── Profit & Loss ──────────────────────────────────────────
async function profitLoss(startDate: string, endDate: string, garageId: string) {
  const start = startDate || new Date().toISOString().slice(0, 7) + '-01';
  const end = endDate || new Date().toISOString().split('T')[0];

  const monthlyBreakdown = await sql`
    SELECT month, income, expense, (income - expense) AS net FROM (
      SELECT
        TO_CHAR(d, 'YYYY-MM') AS month,
        COALESCE((SELECT SUM(amount) FROM income_entries WHERE income_date >= d AND income_date < d + INTERVAL '1 month' AND garage_id = ${garageId}), 0)::numeric AS income,
        COALESCE((SELECT SUM(amount) FROM expense_entries WHERE expense_date >= d AND expense_date < d + INTERVAL '1 month' AND garage_id = ${garageId}), 0)::numeric AS expense
      FROM generate_series(${start}::date, ${end}::date, '1 month'::interval) d
    ) sub ORDER BY month
  `;

  const [totals] = await sql`
    SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM income_entries WHERE income_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId})::numeric AS "totalIncome",
      (SELECT COALESCE(SUM(amount), 0) FROM expense_entries WHERE expense_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId})::numeric AS "totalExpense"
  `;

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate: start, endDate: end },
      monthlyBreakdown,
      totalIncome: Number(totals.totalIncome),
      totalExpense: Number(totals.totalExpense),
      netProfit: Number(totals.totalIncome) - Number(totals.totalExpense),
    },
  });
}

// ── Payment History ────────────────────────────────────────
async function paymentHistory(startDate: string, endDate: string, tenantId: string, garageId: string) {
  const start = startDate || new Date().toISOString().slice(0, 7) + '-01';
  const end = endDate || new Date().toISOString().split('T')[0];

  const conditions: string[] = [`ie.income_date BETWEEN $1 AND $2`, `ie.garage_id = $3`];
  const params: unknown[] = [start, end, garageId];

  if (tenantId) {
    params.push(tenantId);
    conditions.push(`ie.tenant_id = $${params.length}`);
  }

  const rows = await sql.query(
    `SELECT ie.id, ie.income_date AS "incomeDate", ie.category, ie.amount,
      ie.payment_method AS "paymentMethod", ie.receipt_number AS "receiptNumber",
      ie.notes, t.name AS "tenantName", t.mobile AS "tenantMobile"
    FROM income_entries ie
    LEFT JOIN tenants t ON t.id = ie.tenant_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ie.income_date DESC, ie.created_at DESC`,
    params,
  );

  const [summary] = await sql.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count
     FROM income_entries ie WHERE ${conditions.join(' AND ')}`,
    params,
  );

  return NextResponse.json({
    success: true,
    data: { period: { startDate: start, endDate: end }, payments: rows, totalAmount: Number(summary.total), totalCount: summary.count },
  });
}

// ── Monthly Collection ─────────────────────────────────────
async function monthlyCollection(startDate: string, endDate: string, garageId: string) {
  const start = startDate || new Date().toISOString().slice(0, 7) + '-01';
  const end = endDate || new Date().toISOString().split('T')[0];

  const dailyBreakdown = await sql`
    SELECT income_date AS "date",
      COALESCE(SUM(amount), 0)::numeric AS total,
      COUNT(*)::int AS count
    FROM income_entries
    WHERE income_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId}
    GROUP BY income_date
    ORDER BY income_date DESC
  `;

  const [totals] = await sql`
    SELECT COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count
    FROM income_entries WHERE income_date BETWEEN ${start} AND ${end} AND garage_id = ${garageId}
  `;

  return NextResponse.json({
    success: true,
    data: { period: { startDate: start, endDate: end }, dailyBreakdown, totalAmount: Number(totals.total), totalCount: totals.count },
  });
}
