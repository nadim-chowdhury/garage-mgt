import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from '@/lib/auth';
import type { ApiResponse, SessionPayload } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone and password are required' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Find user by phone with garage info
    const rows = await sql`
      SELECT
        u.id, u.phone, u.password_hash, u.name, u.role, u.status,
        u.garage_id AS "garageId",
        g.name AS "garageName"
      FROM users u
      JOIN garages g ON g.id = u.garage_id
      WHERE u.phone = ${phone}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const user = rows[0];

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Contact your administrator.' } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    // Create JWT session
    const sessionPayload: SessionPayload = {
      userId: user.id,
      garageId: user.garageId,
      role: user.role,
      name: user.name,
      garageName: user.garageName,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          garageId: user.garageId,
          garageName: user.garageName,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
