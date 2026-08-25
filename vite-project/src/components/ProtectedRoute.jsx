import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

// rolesAllowed: array of roles e.g. ['admin','super_admin']
const ProtectedRoute = ({ rolesAllowed }) => {
  const auth = useSelector(state => state.auth)
  const user = auth?.user
  const location = useLocation()
  if (auth?.token && (!auth.sessionValidated || auth.loading)) {
    return <div className="container py-5 text-center">Checking session...</div>
  }
  if (!auth?.isAuthenticated && !auth?.token) {
    return <Navigate to="/login" replace />
  }
  // A temp/first-login password must be changed before anything else is usable.
  if (user?.passwordChangeRequired && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }
  if (rolesAllowed && rolesAllowed.length > 0) {
    if (!user || !rolesAllowed.includes(user.role)) return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default ProtectedRoute
