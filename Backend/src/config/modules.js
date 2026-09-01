// Company feature entitlements.
//
// A "module" here is a company-level feature toggle. `Company.enabledModules`
// holds the keys a company currently has; `requireModule(key)` enforces it on
// the API and the frontend hides anything a company does not have.
//
// Legacy keys (kept for backward compatibility — existing route gates use them):
//   employees, attendance, leaves, doctors, medicals, visits, tasks, orders,
//   reports, performance, documents, notifications, calendar, payroll
// Granular keys added later split some of the above so Super Admin can control
// sub-features independently.

export const MODULE_CATALOG = [
  // --- Core ---
  { key: 'employees', label: 'Employees', category: 'Core', description: 'Employee directory, invitations and profiles.' },
  { key: 'organization_chart', label: 'Organization Chart', category: 'Core', description: 'Reporting-line tree and org units.' },
  { key: 'attendance', label: 'Attendance', category: 'Core', description: 'Check-in/out, attendance history and approval.' },
  { key: 'calendar', label: 'Calendar & Holidays', category: 'Core', description: 'Company holidays and working days.' },
  { key: 'notifications', label: 'Notifications', category: 'Core', description: 'In-app notification centre.' },
  { key: 'reports', label: 'Reports & Exports', category: 'Core', description: 'Cross-module reports and CSV exports.' },
  { key: 'documents', label: 'Employee Documents', category: 'Core', description: 'Onboarding document upload and verification.' },
  { key: 'performance', label: 'Performance', category: 'Core', description: 'Performance tracking.' },

  // --- Field / CRM ---
  { key: 'doctors', label: 'Doctors', category: 'Field', description: 'Doctor directory, CRM and engagement.' },
  { key: 'doctor_import', label: 'Doctor Excel Import', category: 'Field', description: 'Bulk-import doctors from a spreadsheet.', dependsOn: ['doctors'] },
  { key: 'medicals', label: 'Medicals / Chemists', category: 'Field', description: 'Chemist / pharmacy directory.' },
  { key: 'visits', label: 'Visits', category: 'Field', description: 'Field visit logging and verification.' },
  { key: 'tour_plans', label: 'Tour Plans', category: 'Field', description: 'Weekly tour planning and coverage.', dependsOn: ['visits'] },
  { key: 'territories', label: 'Territories', category: 'Field', description: 'Territory management for doctors and chemists.' },

  // --- Sales ---
  { key: 'sales_targets', label: 'Sales Targets', category: 'Sales', description: 'Monthly sales and visit targets.' },
  { key: 'orders', label: 'Orders', category: 'Sales', description: 'Product orders for doctors.' },
  { key: 'products', label: 'Product Catalog', category: 'Sales', description: 'Company product catalog.' },

  // --- People Ops ---
  { key: 'leaves', label: 'Leave Management', category: 'People Ops', description: 'Leave requests, policy and balances.' },
  { key: 'expenses', label: 'Expense Claims', category: 'People Ops', description: 'Expense submission and approval.' },
  { key: 'tasks', label: 'Tasks', category: 'People Ops', description: 'Task assignment and tracking.' },

  // --- Payroll ---
  { key: 'payroll', label: 'Salary & Payroll', category: 'Payroll', description: 'Salary structures, slips and payroll runs.' },
  { key: 'offer_letters', label: 'Offer Letters', category: 'Payroll', description: 'Offer letter creation and delivery.', dependsOn: ['payroll'] },
];

export const MODULES = MODULE_CATALOG.map((m) => m.key);

const KEY_SET = new Set(MODULES);
const DEPENDENCIES = Object.fromEntries(
  MODULE_CATALOG.filter((m) => Array.isArray(m.dependsOn) && m.dependsOn.length).map((m) => [m.key, m.dependsOn])
);

// Keep only valid keys; drop duplicates.
export function normalizeModules(modules) {
  if (!Array.isArray(modules)) return [...MODULES];
  return [...new Set(modules.filter((module) => KEY_SET.has(module)))];
}

// Resolve the feature set a company effectively has.
// A company created before a key existed will not have it in its stored array;
// treat "no stored array" or an array missing granular keys generously so
// existing companies never lose access silently — Super Admin removes access
// explicitly. The one-time migration (utils/migrateCompanyModules) makes every
// company's array explicit so this only matters for un-migrated data.
export function resolveEnabledModules(company) {
  if (!Array.isArray(company?.enabledModules)) return [...MODULES];
  const stored = normalizeModules(company?.enabledModules);
  return stored;
}

export function isModuleEnabled(company, key) {
  if (!KEY_SET.has(key)) return true; // unknown key — not a gated feature
  return resolveEnabledModules(company).includes(key);
}

// Given a desired enabled set, auto-add any dependency a kept feature needs.
export function applyDependencies(enabled) {
  const set = new Set(normalizeModules(enabled));
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...set]) {
      for (const dep of DEPENDENCIES[key] || []) {
        if (!set.has(dep)) { set.add(dep); changed = true; }
      }
    }
  }
  return [...set];
}

// When disabling a feature, also disable everything that depends on it.
export function dependentsOf(key) {
  return Object.entries(DEPENDENCIES).filter(([, deps]) => deps.includes(key)).map(([k]) => k);
}

export function withDependentsRemoved(enabled, removedKey) {
  const set = new Set(normalizeModules(enabled));
  const stack = [removedKey];
  while (stack.length) {
    const k = stack.pop();
    set.delete(k);
    for (const dependent of dependentsOf(k)) {
      if (set.has(dependent)) stack.push(dependent);
    }
  }
  return [...set];
}
