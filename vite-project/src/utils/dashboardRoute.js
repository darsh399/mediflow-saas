// Single source of truth for "where does this role land after login / on '/' /
// when a public auth page is blocked". Reuses the existing dashboard routes
// already wired up in AppRoutes.jsx — never invent a new page here, only map
// to routes that already exist and already accept the role in their
// ProtectedRoute `rolesAllowed` list (to avoid redirect loops).
const DASHBOARD_ROUTES = {
  super_admin: '/superadmin/dashboard',
  admin: '/admin',
  company_owner: '/admin',
  hr_manager: '/admin',
  hr: '/admin',
  manager: '/admin',
  project_manager: '/admin',
  employee: '/profile',
  mr: '/profile',
};

// Fallback for roles with no dedicated dashboard (e.g. a freshly self-registered
// "user" account that doesn't own/belong to a company yet). '/calendar' is the
// only existing protected route that accepts every such role, so it's the one
// destination guaranteed not to bounce back into a redirect loop.
const DEFAULT_DASHBOARD_ROUTE = '/calendar';

export function getDashboardRoute(role) {
  return DASHBOARD_ROUTES[role] || DEFAULT_DASHBOARD_ROUTE;
}

export default getDashboardRoute;
