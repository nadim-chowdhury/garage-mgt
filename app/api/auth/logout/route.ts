import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import type { ApiResponse } from '@/types';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    } satisfies ApiResponse<{ message: string }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

