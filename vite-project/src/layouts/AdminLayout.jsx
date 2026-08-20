import Header from '../components/Header'
import Footer from '../components/Footer'
import { Outlet, Link } from 'react-router-dom'

const AdminLayout = () => {
  return (
    <div>
      <Header />
      <div className="container-fluid">
        <div className="row">
          <nav className="col-md-2 d-none d-md-block bg-light sidebar">
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                <li className="nav-item"><Link className="nav-link" to="/admin/doctors">Doctors</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/medicals">Medicals</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/employees">Employees</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/visits">Visits</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/tasks">Tasks</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/orders">Orders</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/notifications">Notifications</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/employee/onboarding">My onboarding</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/employee/profiles">Profile reviews</Link></li>
              </ul>
            </div>
          </nav>

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AdminLayout
