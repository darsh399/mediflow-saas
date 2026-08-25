import AuditLog from '../models/AuditLog.js';

export default async function recordAudit(req, action, target = {}, meta = {}) {
  return AuditLog.create({
    actorId: req.user?.id,
    actorRole: req.user?.role,
    companyId: req.user?.companyId,
    action,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...target,
    meta
  });
}
