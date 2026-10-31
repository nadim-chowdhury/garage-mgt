import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { ApiResponse, SessionPayload } from '@/types';

/**
 * POST /api/auth/register
 *
 * Creates the first admin user for a garage.
 * This endpoint works in two modes:
 *   1. If no garages exist at all, creates a new garage + admin user (initial setup).
 *   2. If a garage already exists, only allows registration if the garage has no users.
 *
 * After first admin is created, further users must be added manually in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name, garageName, garageAddress } = body;

    if (!phone || !password || !name || !garageName) {
      return NextResponse.json(
        { success: false, error: 'Phone, password, name, and garage name are required' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Check for duplicate phone
    const existingPhone = await sql`SELECT id FROM users WHERE phone = ${phone.trim()}`;
    if (existingPhone.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' } satisfies ApiResponse<never>,
        { status: 409 },
      );
    }

    // Create garage
    const [garage] = await sql`
      INSERT INTO garages (name, address, owner_name, owner_mobile)
      VALUES (${garageName.trim()}, ${garageAddress?.trim() ?? ''}, ${name.trim()}, ${phone.trim()})
      RETURNING id, name
    `;

    // Create admin user
    const passwordHash = await hashPassword(password);
    const [user] = await sql`
      INSERT INTO users (phone, password_hash, name, role, garage_id, status)
      VALUES (${phone.trim()}, ${passwordHash}, ${name.trim()}, 'admin', ${garage.id}, 'active')
      RETURNING id, phone, name, role
    `;

    // Log audit
    await logAudit({
      garageId: garage.id,
      userId: user.id,
      userName: user.name,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      details: `Garage owner registered: ${user.name} for ${garage.name}`,
    });

    // Auto-login
    const sessionPayload: SessionPayload = {
      userId: user.id,
      garageId: garage.id,
      role: 'admin',
      name: user.name,
      garageName: garage.name,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            garageId: garage.id,
            garageName: garage.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

