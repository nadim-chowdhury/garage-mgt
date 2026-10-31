import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const garageId = session.garageId;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    // Today's income
    const [todayIncomeRes] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM income_entries WHERE income_date = ${today} AND garage_id = ${garageId}
    `;
    // Today's expense
    const [todayExpenseRes] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expense_entries WHERE expense_date = ${today} AND garage_id = ${garageId}
    `;
    // Monthly income
    const [monthIncomeRes] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM income_entries WHERE income_date >= ${monthStart} AND garage_id = ${garageId}
    `;
    // Monthly expense
    const [monthExpenseRes] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expense_entries WHERE expense_date >= ${monthStart} AND garage_id = ${garageId}
    `;
    // Total dues (rent)
    const [duesRes] = await sql`
      SELECT COALESCE(SUM(due_amount), 0)::numeric AS total FROM rent_payments WHERE payment_status IN ('unpaid', 'partial', 'overdue') AND garage_id = ${garageId}
    `;
    // Total dues (daily entries)
    const [dailyDuesRes] = await sql`
      SELECT COALESCE(SUM(charge_amount - paid_amount), 0)::numeric AS total FROM daily_vehicle_entries WHERE payment_status IN ('unpaid', 'partial', 'overdue') AND garage_id = ${garageId}
    `;
    // Active tenants
    const [activeTenantsRes] = await sql`
      SELECT COUNT(*)::int AS total FROM tenants WHERE status = 'active' AND garage_id = ${garageId}
    `;
    // Today's vehicles
    const [todayVehiclesRes] = await sql`
      SELECT COUNT(*)::int AS total FROM daily_vehicle_entries WHERE entry_date = ${today} AND garage_id = ${garageId}
    `;
    // Overdue rents
    const [overdueRes] = await sql`
      SELECT COUNT(*)::int AS total FROM rent_payments WHERE payment_status = 'overdue' AND garage_id = ${garageId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        todayIncome: Number(todayIncomeRes.total),
        todayExpense: Number(todayExpenseRes.total),
        totalDues: Number(duesRes.total) + Number(dailyDuesRes.total),
        activeTenants: activeTenantsRes.total,
        todayVehicles: todayVehiclesRes.total,
        monthlyIncome: Number(monthIncomeRes.total),
        monthlyExpense: Number(monthExpenseRes.total),
        overdueRents: overdueRes.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
