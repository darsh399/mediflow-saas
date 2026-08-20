
export function hasAnyRole(user, roles = []) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    if (!hasAnyRole(user, roles)) return res.status(403).json({ message: 'Insufficient permissions' });
    return next();
  };
}

export default { hasAnyRole, requireRole };

// Role hierarchy helpers
// Role hierarchy can be configured via env `ROLE_HIERARCHY` (comma-separated)
const DEFAULT_ROLE_HIERARCHY = [
  'super_admin',
  'admin',
  'company_owner',
  'hr_manager',
  'hr',
  'manager',
  'employee',
  'user',
];

const envHierarchy = process.env.ROLE_HIERARCHY;
export const ROLE_HIERARCHY = envHierarchy && typeof envHierarchy === 'string'
  ? envHierarchy.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ROLE_HIERARCHY;

export function roleRank(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? ROLE_HIERARCHY.length : idx;
}

// Privileged roles (who can act on anyone or change roles) configurable via PRIVILEGED_ROLES
const envPriv = process.env.PRIVILEGED_ROLES;
export const PRIVILEGED_ROLES = envPriv && typeof envPriv === 'string'
  ? envPriv.split(',').map((s) => s.trim()).filter(Boolean)
  : ['super_admin', 'admin', 'company_owner'];

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.includes(role);
}

// Return true if `actor` is allowed to act on a target with `targetRole`.
// Rules:
// - any role listed in PRIVILEGED_ROLES can act on anyone
// - otherwise actor can act only on users with lower privilege (higher rank number)
export function canActOn(actor, targetRole) {
  if (!actor || !actor.role) return false;
  if (isPrivilegedRole(actor.role)) return true;
  const actorRank = roleRank(actor.role);
  const targetRank = roleRank(targetRole);
  return actorRank > -1 && actorRank < targetRank;
}
