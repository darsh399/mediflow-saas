import { Outlet, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

const AdminLayout = () => {
  const role = useSelector(state => state.auth.user?.role)
  const canManageCompany = ['admin', 'company_owner', 'manager', 'project_manager'].includes(role)
  const canReviewProfiles = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'].includes(role)
  return (
    <div>
      <div className="container-fluid">
        <div className="row">
          <nav className="col-md-2 bg-light sidebar">
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                {canManageCompany && <>
                  <li className="nav-item"><Link className="nav-link" to="/admin/doctors">Doctors</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/medicals">Medicals</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/users">Employees</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/visits">Visits</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/hr/leaves">Leaves</Link></li>
                </>}
                <li className="nav-item"><Link className="nav-link" to="/tasks">Tasks</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/projects">Projects</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/orders">Orders</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/notifications">Notifications</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/employee/onboarding">My onboarding</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/users">Employees</Link></li>
                 <li className="nav-item"><Link className="nav-link" to="/admin/doctors">Doctors</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/medicals">Medicals</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/employee/activity">Daily activity</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/employee/visits">My Visits</Link></li>
                {canReviewProfiles && <li className="nav-item"><Link className="nav-link" to="/employee/profiles">Profile reviews</Link></li>}
              </ul>
            </div>
          </nav>

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
