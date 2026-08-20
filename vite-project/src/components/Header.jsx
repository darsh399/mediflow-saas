import { Link } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import NotificationBell from './NotificationBell'
import { logout, clearAuth } from '../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector(state => state.auth)

  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1100 }}>
      <div className="container">

        {/* Logo + Company Name */}
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center gap-2"
        >
          <div
            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-3 fw-bold"
            style={{ width: "42px", height: "42px" }}
          >
            M
          </div>

          <div className="lh-sm">
            <div className="fw-bold text-dark">
              MediFlow
            </div>

            <small className="text-secondary">
              Business Management
            </small>
          </div>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen(o => !o)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div
          className={`collapse navbar-collapse ${open ? 'show' : ''}`}
          id="mainNavbar"
          style={open ? { zIndex: 1200, position: 'relative' } : undefined}
        >

          {/* Navigation */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

            <li className="nav-item">
              <Link to="/" className="nav-link px-3" onClick={()=>setOpen(false)}>Home</Link>
            </li>

            <li className="nav-item">
              <Link to="/features" className="nav-link px-3" onClick={()=>setOpen(false)}>Features</Link>
            </li>

            <li className="nav-item">
              <Link to="/pricing" className="nav-link px-3" onClick={()=>setOpen(false)}>Pricing</Link>
            </li>

            <li className="nav-item">
              <Link to="/about" className="nav-link px-3" onClick={()=>setOpen(false)}>About</Link>
            </li>

          </ul>

          {/* Right Buttons */}
          <div className="d-flex align-items-center gap-2">
            <NotificationBell />
                    {isAuthenticated ? (
                      <>
                        {user?.role === 'super_admin' && (
                          <Link to="/superadmin/dashboard" className="btn btn-outline-secondary">Dashboard</Link>
                        )}
                        <button className="btn btn-outline-danger" onClick={async ()=>{ try{ await dispatch(logout()).unwrap() }catch(e){ /* ignore */ } dispatch(clearAuth()); navigate('/') }}>Logout</button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="btn btn-outline-primary px-4"
                        >
                          Login
                        </Link>

                        <Link
                          to="/register"
                          className="btn btn-primary px-4"
                        >
                          Get Started
                        </Link>
                      </>
                    )}

          </div>

        </div>
      </div>
    </nav>
  );
};

export default Header;