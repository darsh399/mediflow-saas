import AuditLog from '../models/AuditLog.js';

export async function listAuditLogs(req, res) {
  try {
    const filter = { companyId: req.user.companyId };
    if (req.query.module) filter.module = req.query.module;
    if (req.query.action) filter.action = { $regex: String(req.query.action).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
      if (req.query.to) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);

    const [logs, total, modules] = await Promise.all([
      AuditLog.find(filter).populate('actorId', 'name email role').populate('targetUserId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
      AuditLog.distinct('module', { companyId: req.user.companyId }),
    ]);

    return res.status(200).json({ logs, modules: modules.filter(Boolean).sort(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List audit logs error:', error);
    return res.status(500).json({ message: 'Error listing audit logs', error: error.message });
  }
}

export default { listAuditLogs };
