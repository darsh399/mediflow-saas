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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/leaves")) setLeavesOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    const toggleSidebar = () => setSidebarOpen((open) => !open);
    const closeSidebar = () => setSidebarOpen(false);
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const handleBreakpoint = (event) => { if (event.matches) setSidebarOpen(false); };
    window.addEventListener("mediflow:toggle-sidebar", toggleSidebar);
    window.addEventListener("mediflow:close-sidebar", closeSidebar);
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => {
      window.removeEventListener("mediflow:toggle-sidebar", toggleSidebar);
      window.removeEventListener("mediflow:close-sidebar", closeSidebar);
      mediaQuery.removeEventListener("change", handleBreakpoint);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mf-drawer-open", sidebarOpen);
    return () => document.body.classList.remove("mf-drawer-open");
  }, [sidebarOpen]);

  const navClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />}
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`} aria-label="Workspace navigation">
        <div className="sidebar-brand"><span className="brand-icon">M</span><span><strong>MediFlow</strong><small>Workspace</small></span><button type="button" className="sidebar-close" aria-label="Close navigation" onClick={closeSidebar}><i className="bi bi-x-lg"></i></button></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-label">WORKSPACE</p>
          <NavLink className={navClass} to={canManageCompany ? "/admin" : "/profile"} onClick={closeSidebar}><i className="bi bi-grid-1x2"></i> Dashboard</NavLink>
          <NavLink className={navClass} to="/profile" onClick={closeSidebar}><i className="bi bi-person"></i> My Profile</NavLink>

          <p className="sidebar-label">LEAVE MANAGEMENT</p>
          <button type="button" className={`sidebar-link folder-button ${location.pathname.startsWith("/leaves") ? "active" : ""}`} onClick={() => setLeavesOpen((open) => !open)} aria-expanded={leavesOpen}>
            <i className="bi bi-calendar2-week"></i><span>Leaves</span><i className={`bi ms-auto ${leavesOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </button>
          {leavesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/leaves/apply" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Apply Leave</NavLink>
            <NavLink className={navClass} to="/leaves/my" onClick={closeSidebar}><i className="bi bi-clock-history"></i> My Leave Requests</NavLink>
            {canReviewLeaves && <NavLink className={navClass} to="/leaves/manage" onClick={closeSidebar}><i className="bi bi-clipboard-check"></i> Review Requests</NavLink>}
          </div>}

          {isMr && <><p className="sidebar-label">MR TOOLS</p>
            <NavLink className={navClass} to="/users"><i className="bi bi-people"></i> Employees</NavLink>
            <NavLink className={navClass} to="/doctors"><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
            <NavLink className={navClass} to="/doctors/add"><i className="bi bi-person-plus"></i> Add Doctor</NavLink>
            <NavLink className={navClass} to="/mr/add-visit"><i className="bi bi-geo-alt"></i> Add Visit</NavLink>
            <NavLink className={navClass} to="/employee/visits"><i className="bi bi-map"></i> My Visits</NavLink>
            <NavLink className={navClass} to="/medicals"><i className="bi bi-hospital"></i> Medicals</NavLink>
            <NavLink className={navClass} to="/medicals/add"><i className="bi bi-plus-square"></i> Add Medical</NavLink>
          </>}

          <p className="sidebar-label">WORK</p>
          <NavLink className={navClass} to="/tasks" onClick={closeSidebar}><i className="bi bi-check2-square"></i> Tasks</NavLink>
          {canManageCompany && <NavLink className={navClass} to="/projects" onClick={closeSidebar}><i className="bi bi-kanban"></i> Projects</NavLink>}
          <NavLink className={navClass} to="/orders" onClick={closeSidebar}><i className="bi bi-bag"></i> Orders</NavLink>
          <NavLink className={navClass} to="/notifications" onClick={closeSidebar}><i className="bi bi-bell"></i> Notifications</NavLink>
          {canSendCompanyMessages && <NavLink className={navClass} to="/messages/send" onClick={closeSidebar}><i className="bi bi-send"></i> Send Message</NavLink>}

          {canManageCompany && <><p className="sidebar-label">COMPANY</p>
            <NavLink className={navClass} to="/users"><i className="bi bi-people"></i> Employees</NavLink>
            <NavLink className={navClass} to="/doctors"><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
            <NavLink className={navClass} to="/medicals"><i className="bi bi-hospital"></i> Medicals</NavLink>
            <NavLink className={navClass} to="/admin/visits"><i className="bi bi-clipboard-data"></i> MR Visit Records</NavLink>
          </>}
        </nav>
      </aside>
      <main className="app-content"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
