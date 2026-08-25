export const MODULES = [
  'employees',
  'attendance',
  'leaves',
  'doctors',
  'medicals',
  'visits',
  'tasks',
  'orders',
  'reports',
  'performance',
  'documents',
  'notifications',
  'calendar',
]

export function normalizeModules(modules) {
  if (!Array.isArray(modules)) return [...MODULES]
  return [...new Set(modules.filter((module) => MODULES.includes(module)))]
}
