const rolePermissions = {
  super_admin: ['*'],
  admin: ['*'],
  company_owner: [
    'company.view', 'company.update', 'subscription.view',
    'employee.view', 'employee.create', 'employee.update', 'employee.delete',
    'leave.view', 'leave.apply', 'leave.update', 'leave.cancel', 'leave.approve', 'leave.reject', 'leave.adjust_balance', 'leave.manage_policy', 'leave.view_ledger', 'leave.view_history',
    'attendance.view', 'attendance.create', 'attendance.approve',
    'doctor.view', 'doctor.create', 'doctor.update', 'doctor.delete',
    'visit.view', 'visit.create', 'visit.update', 'visit.approve', 'visit.reject',
    'task.view', 'task.create', 'task.assign', 'task.update',
    'document.view', 'document.upload', 'document.verify', 'document.delete',
    'report.view', 'report.export', 'audit.view', 'performance.view', 'performance.manage',
    'organization.view', 'organization.manage',
    'calendar.view', 'calendar.manage',
    'salary.view', 'salary.manage', 'salary_slip.view', 'salary_slip.manage', 'offer.view', 'offer.manage',
  ],
  hr_manager: [
    'employee.view', 'employee.create', 'employee.update', 'employee.delete',
    'visit.view',
    'leave.view', 'leave.apply', 'leave.update', 'leave.cancel', 'leave.approve', 'leave.reject', 'leave.adjust_balance', 'leave.manage_policy', 'leave.view_ledger', 'leave.view_history',
    'attendance.view', 'attendance.create', 'attendance.approve',
    'document.view', 'document.upload', 'document.verify', 'document.delete',
    'report.view', 'report.export', 'audit.view', 'performance.view', 'performance.manage',
    'organization.view', 'organization.manage',
    'calendar.view', 'calendar.manage',
    'salary.view', 'salary.manage', 'salary_slip.view', 'salary_slip.manage', 'offer.view', 'offer.manage',
  ],
  // Normal HR: can view employees, leave requests, and onboarding
  // documents/profiles company-wide (including checking off individual
  // documents as verified), but intentionally excludes salary/offer/
  // salary_slip permissions and final approval authority — only
  // company_owner and hr_manager may approve/reject leave, review/approve
  // onboarding profiles, or manage salary, offer letters, and salary slips.
  hr: [
    'employee.view', 'employee.create', 'employee.update',
    'leave.view', 'leave.apply', 'leave.update', 'leave.cancel', 'leave.view_ledger', 'leave.view_history',
    'attendance.view', 'attendance.create', 'document.view', 'document.upload', 'document.verify',
    'report.view', 'performance.view',
    'organization.view', 'organization.manage',
    // Can view the calendar/holidays declared by hr_manager/company_owner,
    // but cannot add/remove holidays or change working days — no calendar.manage.
    'calendar.view',
  ],
  manager: [
    'employee.view', 'leave.view', 'leave.apply', 'leave.cancel', 'leave.approve', 'leave.reject', 'leave.view_history', 'leave.view_ledger',
    'attendance.view', 'attendance.approve', 'doctor.view', 'doctor.create',
    'doctor.update', 'medical.view', 'medical.create', 'medical.update',
    'visit.view', 'visit.create', 'visit.update', 'visit.approve', 'visit.reject',
    'task.view', 'task.create', 'task.assign', 'task.update',
    'report.view', 'performance.view', 'performance.manage',
  ],
  project_manager: [
    'employee.view', 'leave.view', 'leave.apply', 'leave.cancel', 'leave.view_history', 'attendance.view', 'task.view', 'task.create', 'task.assign', 'task.update',
    'project.view', 'project.create', 'project.update', 'report.view',
  ],
  mr: ['employee.view', 'leave.view', 'leave.apply', 'leave.cancel', 'leave.view_history', 'doctor.view', 'doctor.create', 'medical.view', 'medical.create', 'visit.view', 'visit.create', 'attendance.view', 'attendance.create', 'task.view', 'task.update', 'calendar.view'],
  employee: ['employee.view', 'leave.view', 'leave.apply', 'leave.cancel', 'attendance.view', 'attendance.create', 'doctor.view', 'medical.view', 'visit.view', 'visit.create', 'task.view', 'task.update', 'document.view', 'document.upload', 'performance.view', 'calendar.view', 'leave.view_history', 'salary.view', 'salary_slip.view', 'offer.view'],
  user: ['employee.view', 'leave.view', 'leave.apply', 'leave.cancel', 'attendance.view', 'attendance.create', 'task.view', 'task.update', 'calendar.view', 'leave.view_history'],
}

export function hasPermission(user, permission) {
  if (!user?.role || !permission) return false
  const permissions = rolePermissions[user.role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

export function permissionsForRole(role) {
  return [...(rolePermissions[role] || [])]
}

export default rolePermissions
