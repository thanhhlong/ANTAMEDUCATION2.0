import { AuditLogEntry, AuditActionType, UserRole } from '../types';
import { saveDocument } from './firebase';

const LOCAL_AUDIT_KEY = 'antam_audit_logs_v3';

// In-memory runtime cache
let localLogsCache: AuditLogEntry[] = [];

try {
  const stored = localStorage.getItem(LOCAL_AUDIT_KEY);
  if (stored) {
    localLogsCache = JSON.parse(stored);
  }
} catch (e) {
  localLogsCache = [];
}

/**
 * Record an audit log event to Backend REST API, Firestore, and LocalStorage
 */
export async function logAuditEvent(params: {
  action: AuditActionType;
  entity: string;
  entityId?: string;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  severity?: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
}): Promise<AuditLogEntry> {
  const timestamp = new Date().toISOString();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const entry: AuditLogEntry = {
    id,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    description: params.description,
    actorId: params.actorId || 'system',
    actorName: params.actorName || 'Hệ thống',
    actorRole: params.actorRole || 'SUPER_ADMIN',
    timestamp,
    severity: params.severity || 'info',
    details: params.details || {},
  };

  // 1. Save to LocalStorage
  try {
    localLogsCache.unshift(entry);
    if (localLogsCache.length > 300) {
      localLogsCache = localLogsCache.slice(0, 300);
    }
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(localLogsCache));
  } catch (err) {
    console.warn('Could not write audit log to localStorage:', err);
  }

  // 2. Push to Backend Express REST API asynchronously
  fetch('/api/audit/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch((err) => {
    console.warn('Backend audit API offline or unreachable:', err);
  });

  // 3. Persist to Firestore audit_logs collection asynchronously
  saveDocument('audit_logs', entry.id, entry).catch((err) => {
    console.warn('Firestore audit_logs save notice:', err);
  });

  return entry;
}

/**
 * Get all available audit logs
 */
export function getLocalAuditLogs(): AuditLogEntry[] {
  return [...localLogsCache];
}

/**
 * Fetch remote audit logs from Backend REST API
 */
export async function fetchRemoteAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/audit/logs');
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('Could not fetch remote audit logs:', err);
  }
  return getLocalAuditLogs();
}
