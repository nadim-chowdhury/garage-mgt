import { sql } from '@/lib/db';

export interface LogAuditParams {
  garageId: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  entityType:
    | 'tenant'
    | 'vehicle'
    | 'daily_entry'
    | 'rent_payment'
    | 'income'
    | 'expense'
    | 'user';
  entityId?: string;
  details?: string;
}

export async function logAudit({
  garageId,
  userId,
  userName,
  action,
  entityType,
  entityId = '',
  details = '',
}: LogAuditParams): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (garage_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (${garageId}, ${userId}, ${userName}, ${action}, ${entityType}, ${entityId}, ${details})
    `;
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

