import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { getDashboardRoute } from '../utils/dashboardRoute'

// Guards public-only pages (home, login): an authenticated user must
// never see them. Mirrors ProtectedRoute's session-loading check so the login
// page never flashes before the redirect fires.
const GuestRoute = () => {
  const auth = useSelector(state => state.auth)
  if (auth?.token && (!auth.sessionValidated || auth.loading)) {
    return <div className="container py-5 text-center">Checking session...</div>
  }
  if (auth?.isAuthenticated && auth?.user) {
    return <Navigate to={getDashboardRoute(auth.user.role)} replace />
  }
  return <Outlet />
}

export default GuestRoute
