import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"];
const COMPANY_ROLES = ["admin", "company_owner", "manager", "project_manager"];
const MESSAGE_SENDER_ROLES = ["admin", "company_owner", "hr_manager"];

const AdminLayout = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const location = useLocation();
  const canManageCompany = COMPANY_ROLES.includes(role);
  const canSendCompanyMessages = MESSAGE_SENDER_ROLES.includes(role);
  const canReviewLeaves = REVIEWER_ROLES.includes(role);
  const isMr = role === "mr";
  const [leavesOpen, setLeavesOpen] = useState(location.pathname.startsWith("/leaves"));

  useEffect(() => {
    if (location.pathname.startsWith("/leaves")) setLeavesOpen(true);
  }, [location.pathname]);

  const navClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand"><span className="brand-icon">M</span><span><strong>MediFlow</strong><small>Workspace</small></span></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-label">WORKSPACE</p>
          <NavLink className={navClass} to={canManageCompany ? "/admin" : "/profile"}><i className="bi bi-grid-1x2"></i> Dashboard</NavLink>
          <NavLink className={navClass} to="/profile"><i className="bi bi-person"></i> My Profile</NavLink>

          <p className="sidebar-label">LEAVE MANAGEMENT</p>
          <button type="button" className={`sidebar-link folder-button ${location.pathname.startsWith("/leaves") ? "active" : ""}`} onClick={() => setLeavesOpen((open) => !open)} aria-expanded={leavesOpen}>
            <i className="bi bi-calendar2-week"></i><span>Leaves</span><i className={`bi ms-auto ${leavesOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </button>
          {leavesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/leaves/apply"><i className="bi bi-plus-circle"></i> Apply Leave</NavLink>
            <NavLink className={navClass} to="/leaves/my"><i className="bi bi-clock-history"></i> My Leave Requests</NavLink>
            {canReviewLeaves && <NavLink className={navClass} to="/leaves/manage"><i className="bi bi-clipboard-check"></i> Review Requests</NavLink>}
          </div>}

          {isMr && <><p className="sidebar-label">MR TOOLS</p>
            <NavLink className={navClass} to="/doctors"><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
            <NavLink className={navClass} to="/doctors/add"><i className="bi bi-person-plus"></i> Add Doctor</NavLink>
            <NavLink className={navClass} to="/mr/add-visit"><i className="bi bi-geo-alt"></i> Add Visit</NavLink>
            <NavLink className={navClass} to="/employee/visits"><i className="bi bi-map"></i> My Visits</NavLink>
            <NavLink className={navClass} to="/medicals"><i className="bi bi-hospital"></i> Medicals</NavLink>
            <NavLink className={navClass} to="/medicals/add"><i className="bi bi-plus-square"></i> Add Medical</NavLink>
          </>}

          <p className="sidebar-label">WORK</p>
          <NavLink className={navClass} to="/tasks"><i className="bi bi-check2-square"></i> Tasks</NavLink>
          {canManageCompany && <NavLink className={navClass} to="/projects"><i className="bi bi-kanban"></i> Projects</NavLink>}
          <NavLink className={navClass} to="/orders"><i className="bi bi-bag"></i> Orders</NavLink>
          <NavLink className={navClass} to="/notifications"><i className="bi bi-bell"></i> Notifications</NavLink>
          {canSendCompanyMessages && <NavLink className={navClass} to="/messages/send"><i className="bi bi-send"></i> Send Message</NavLink>}

          {canManageCompany && <><p className="sidebar-label">COMPANY</p>
            <NavLink className={navClass} to="/users"><i className="bi bi-people"></i> Employees</NavLink>
            <NavLink className={navClass} to="/doctors"><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
            <NavLink className={navClass} to="/medicals"><i className="bi bi-hospital"></i> Medicals</NavLink>
            <NavLink className={navClass} to="/admin/visits"><i className="bi bi-clipboard-data"></i> MR Visit Records</NavLink>
          </>}
        </nav>
      </aside>
      <main className="app-content"><Outlet /></main>
      <style>{`
        .app-shell{min-height:calc(100vh - 68px);background:#f8f9fc}.app-sidebar{position:fixed;top:68px;bottom:0;left:0;width:260px;overflow-y:auto;padding:20px 14px;color:#dbeafe;background:linear-gradient(180deg,#172554,#111827);z-index:1000}.sidebar-brand{display:flex;align-items:center;gap:10px;padding:0 10px 22px;color:#fff;font-size:16px}.sidebar-brand small{display:block;color:#94a3b8;font-size:11px;font-weight:500}.brand-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#3b82f6,#8b5cf6);font-weight:800}.sidebar-label{margin:20px 10px 7px;color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.09em}.sidebar-link{width:100%;display:flex;align-items:center;gap:11px;padding:10px 12px;margin:2px 0;border:0;border-radius:9px;color:#cbd5e1;background:transparent;text-decoration:none;font-size:14px;font-weight:500;text-align:left;transition:.18s ease}.sidebar-link:hover{color:#fff;background:rgba(255,255,255,.09)}.sidebar-link.active{color:#fff;background:linear-gradient(90deg,rgba(37,99,235,.94),rgba(79,70,229,.8));box-shadow:0 5px 14px rgba(0,0,0,.18)}.sidebar-link i{font-size:16px;width:18px;text-align:center}.folder-button{cursor:pointer}.sidebar-submenu{margin:2px 0 6px 13px;padding-left:10px;border-left:1px solid rgba(148,163,184,.35)}.sidebar-submenu .sidebar-link{font-size:13px;padding:8px 10px}.app-content{min-height:calc(100vh - 68px);margin-left:260px;padding:24px}@media(max-width:991px){.app-sidebar{position:static;width:100%;padding:14px}.app-content{margin-left:0;padding:16px}.sidebar-nav,.sidebar-submenu{display:flex;flex-wrap:wrap;gap:3px}.sidebar-label{width:100%;margin-top:12px}.sidebar-link{width:auto}.sidebar-submenu{margin-left:0;border-left:0;padding-left:0}}
      `}</style>
    </div>
  );
};

export default AdminLayout;
