import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth, withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, User, UserRole } from '@/types';

// ── GET /api/users ─────────────────────────────────────────
// List all users in the authenticated user's garage
export const GET = withAuth(async (_request: NextRequest, { garageId }: AuthContext) => {
  try {
    const rows = await sql`
      SELECT
        u.id,
        u.phone,
        u.name,
        u.role,
        u.garage_id AS "garageId",
        g.name      AS "garageName",
        u.status,
        u.created_at AS "createdAt"
      FROM users u
      JOIN garages g ON g.id = u.garage_id
      WHERE u.garage_id = ${garageId}
      ORDER BY u.created_at ASC
    `;

    return NextResponse.json({
      success: true,
      data: rows as User[],
    } satisfies ApiResponse<User[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
});

// ── POST /api/users ────────────────────────────────────────
// Create a new user in the garage (Admin only)
export const POST = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const body = await request.json();
      const { phone, name, password, role } = body;

      if (!phone || !name || !password) {
        return NextResponse.json(
          { success: false, error: 'Phone, name, and password are required' } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }

      const validRoles: UserRole[] = ['admin', 'operator', 'viewer'];
      const userRole: UserRole = validRoles.includes(role) ? role : 'viewer';

      // Check if phone already registered
      const existing = await sql`
        SELECT id FROM users WHERE phone = ${phone.trim()}
      `;
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: 'A user with this phone number already exists' } satisfies ApiResponse<never>,
          { status: 409 },
        );
      }

      const passwordHash = await hashPassword(password);

      const rows = await sql`
        INSERT INTO users (garage_id, phone, name, password_hash, role, status)
        VALUES (${garageId}, ${phone.trim()}, ${name.trim()}, ${passwordHash}, ${userRole}, 'active')
        RETURNING
          id, phone, name, role, garage_id AS "garageId", status, created_at AS "createdAt"
      `;

      const newUser = rows[0] as User;

      // Log audit
      await logAudit({
        garageId,
        userId,
        userName,
        action: 'create',
        entityType: 'user',
        entityId: newUser.id,
        details: `Created user ${newUser.name} (${newUser.phone}) with role ${newUser.role}`,
      });

      return NextResponse.json(
        { success: true, data: newUser } satisfies ApiResponse<User>,
        { status: 201 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);
