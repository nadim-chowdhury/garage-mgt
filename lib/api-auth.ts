import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import type { SessionPayload, UserRole } from '@/types';

// ── Authenticated Request Context ──────────────────────────

export interface AuthContext {
  session: SessionPayload;
  garageId: string;
  role: UserRole;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext,
) => Promise<NextResponse>;

type AuthenticatedRouteHandler = (
  request: NextRequest,
  routeContext: unknown,
  authContext: AuthContext,
) => Promise<NextResponse>;

// ── withAuth — Requires valid session ──────────────────────

/**
 * Higher-order function for API route handlers that require authentication.
 * Extracts session from cookie, injects garageId and role.
 * Returns 401 if no valid session.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 },
      );
    }

    return handler(request, {
      session,
      garageId: session.garageId,
      role: session.role,
    });
  };
}

/**
 * Same as withAuth but for route handlers that receive route context
 * (e.g., [id] params). Passes the route context through.
 */
export function withAuthRoute(handler: AuthenticatedRouteHandler) {
  return async (
    request: NextRequest,
    routeContext: unknown,
  ): Promise<NextResponse> => {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 },
      );
    }

    return handler(request, routeContext, {
      session,
      garageId: session.garageId,
      role: session.role,
    });
  };
}

// ── withWriteAuth — Requires session + non-viewer role ─────

/**
 * Like withAuth, but also checks that the user is not a viewer.
 * Returns 403 if the user's role is 'viewer'.
 */
export function withWriteAuth(handler: AuthenticatedHandler) {
  return withAuth(async (request, context) => {
    if (context.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
      );
    }
    return handler(request, context);
  });
}

/**
 * Like withAuthRoute, but also checks that the user is not a viewer.
 */
export function withWriteAuthRoute(handler: AuthenticatedRouteHandler) {
  return withAuthRoute(async (request, routeContext, context) => {
    if (context.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
      );
    }
    return handler(request, routeContext, context);
  });
}

// ── Delete Auth — Requires admin role ──────────────────────

/**
 * Like withAuthRoute, but requires admin role for destructive actions.
 */
export function withAdminAuthRoute(handler: AuthenticatedRouteHandler) {
  return withAuthRoute(async (request, routeContext, context) => {
    if (context.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 },
      );
    }
    return handler(request, routeContext, context);
  });
}

