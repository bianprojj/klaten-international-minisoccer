import { prisma } from "@/lib/prisma";

export interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  actor?: string;
  ip?: string;
}

const auditEntries: AuditEntry[] = [];

export function auditLog(event: string, details: string, actor?: string, ip?: string) {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${auditEntries.length}`,
    timestamp: new Date().toISOString(),
    event,
    details,
    actor,
    ip,
  };

  auditEntries.push(entry);
  if (auditEntries.length > 500) auditEntries.splice(0, auditEntries.length - 500);
  void prisma.auditLog
    .create({
      data: {
        action: event,
        entity: "system",
        entityId: entry.id,
        changes: details,
        ipAddress: ip,
        referenceEmail: actor,
      },
    })
    .catch((error) => console.error("[AUDIT] Unable to persist audit log:", error));
  return entry;
}

export async function getAuditLogs() {
  try {
    const records = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return records.map((record) => ({
      id: record.id,
      timestamp: record.createdAt.toISOString(),
      event: record.action,
      details: record.changes ?? "",
      actor: record.referenceEmail ?? undefined,
      ip: record.ipAddress ?? undefined,
    }));
  } catch (error) {
    console.error("[AUDIT] Unable to read persisted audit logs:", error);
    return [...auditEntries].reverse();
  }
}
