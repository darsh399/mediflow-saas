import Project from '../models/Project.js'
import User from '../models/User.js'
import { hasAnyRole } from './authorize.js'

// Roles that see the whole company.
const COMPANY_WIDE_ROLES = ['admin', 'company_owner', 'hr_manager', 'hr', 'super_admin', 'superadmin']
// Roles that manage a bounded team (their project members + direct reports).
const TEAM_LEAD_ROLES = ['manager', 'project_manager']

export const seesWholeCompany = (user) => hasAnyRole(user, COMPANY_WIDE_ROLES)
export const isTeamLead = (user) => hasAnyRole(user, TEAM_LEAD_ROLES)
// Anyone who can set targets: company-wide roles + team leads.
export const canManageTargets = (user) => seesWholeCompany(user) || isTeamLead(user)

// Returns the set of employee ids a user is allowed to see performance data for:
//   - company-wide roles  -> null  (meaning "no restriction — the whole company")
//   - team leads          -> their project members + direct reports + themselves
//   - everyone else        -> just themselves
export async function scopedEmployeeIds(user) {
  if (seesWholeCompany(user)) return null
  if (!isTeamLead(user)) return [String(user.id)]

  const [projects, reports] = await Promise.all([
    Project.find({ companyId: user.companyId, managerId: user.id }).select('memberIds').lean(),
    User.find({ companyId: user.companyId, reportingManagerId: user.id }).select('_id').lean(),
  ])
  const ids = new Set([String(user.id)])
  for (const project of projects) {
    for (const member of project.memberIds || []) ids.add(String(member))
  }
  for (const report of reports) ids.add(String(report._id))
  return [...ids]
}

// True when `user` is allowed to act on / view performance data for `employeeId`.
export async function canAccessEmployee(user, employeeId) {
  const allowed = await scopedEmployeeIds(user)
  if (allowed === null) return true
  return allowed.includes(String(employeeId))
}

export default { seesWholeCompany, isTeamLead, canManageTargets, scopedEmployeeIds, canAccessEmployee }
