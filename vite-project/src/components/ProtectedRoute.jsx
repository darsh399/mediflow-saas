import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

// rolesAllowed: array of roles e.g. ['admin','super_admin']
const ProtectedRoute = ({ rolesAllowed }) => {
  const auth = useSelector(state => state.auth)
  const user = auth?.user
  if (auth?.token && (!auth.sessionValidated || auth.loading)) {
    return <div className="container py-5 text-center">Checking session...</div>
  }
  if (!auth?.isAuthenticated && !auth?.token) {
    return <Navigate to="/login" replace />
  }
  if (rolesAllowed && rolesAllowed.length > 0) {
    if (!user || !rolesAllowed.includes(user.role)) return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default ProtectedRoute
