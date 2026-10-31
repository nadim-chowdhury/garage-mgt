import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAdminAuth, type AuthContext } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, User, UserRole, UserStatus } from '@/types';

// ── PUT /api/users/[id] ────────────────────────────────────
export const PUT = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const targetId = url.pathname.split('/').pop() ?? '';

      const body = await request.json();
      const { name, role, status, password } = body;

      // Verify user belongs to same garage
      const existing = await sql`
        SELECT id, name, phone, role, status FROM users
        WHERE id = ${targetId} AND garage_id = ${garageId}
      `;
      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const updates: string[] = [];
      const params: unknown[] = [targetId, garageId];

      if (name) {
        params.push(name.trim());
        updates.push(`name = $${params.length}`);
      }
      if (role && ['admin', 'operator', 'viewer'].includes(role)) {
        params.push(role as UserRole);
        updates.push(`role = $${params.length}`);
      }
      if (status && ['active', 'inactive'].includes(status)) {
        params.push(status as UserStatus);
        updates.push(`status = $${params.length}`);
      }
      if (password && typeof password === 'string' && password.length >= 6) {
        const hash = await hashPassword(password);
        params.push(hash);
        updates.push(`password_hash = $${params.length}`);
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No fields to update' } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }

      const rows = await sql.query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = $1 AND garage_id = $2
         RETURNING id, phone, name, role, garage_id AS "garageId", status, created_at AS "createdAt"`,
        params,
      );

      const updatedUser = rows[0] as User;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'update',
        entityType: 'user',
        entityId: updatedUser.id,
        details: `Updated user ${updatedUser.name} (${updatedUser.phone})`,
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
      } satisfies ApiResponse<User>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

// ── DELETE /api/users/[id] ─────────────────────────────────
export const DELETE = withAdminAuth(
  async (request: NextRequest, { garageId, userId, userName }: AuthContext) => {
    try {
      const url = new URL(request.url);
      const targetId = url.pathname.split('/').pop() ?? '';

      // Prevent admin from deleting themselves
      if (targetId === userId) {
        return NextResponse.json(
          { success: false, error: 'You cannot delete your own account' } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }

      const existing = await sql`
        SELECT id, name, phone FROM users
        WHERE id = ${targetId} AND garage_id = ${garageId}
      `;
      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      await sql`
        DELETE FROM users
        WHERE id = ${targetId} AND garage_id = ${garageId}
      `;

      await logAudit({
        garageId,
        userId,
        userName,
        action: 'delete',
        entityType: 'user',
        entityId: targetId,
        details: `Deleted user ${existing[0].name} (${existing[0].phone})`,
      });

      return NextResponse.json({
        success: true,
        data: { id: targetId },
      } satisfies ApiResponse<{ id: string }>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      return NextResponse.json(
        { success: false, error: message } satisfies ApiResponse<never>,
        { status: 500 },
      );
    }
  },
);

