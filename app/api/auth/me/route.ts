import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import type { ApiResponse, SessionPayload } from '@/types';

export async function GET() {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    } satisfies ApiResponse<SessionPayload>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get session';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

