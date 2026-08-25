import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardRoute } from "../utils/dashboardRoute";

// Leave "Review Requests" (approve/reject) is reserved for hr_manager,
// company_owner and admin — normal hr does not get this link.
const REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const COMPANY_ROLES = ["admin", "company_owner", "manager", "project_manager"];
const MESSAGE_SENDER_ROLES = ["admin", "company_owner", "hr_manager"];
// Normal hr can browse/check onboarding documents but not approve/reject them
// (that's gated separately, per-profile, by the backend's reviewEligibility).
// Distinct from REVIEWER_ROLES, which still governs the unrelated leave-request
// review feature.
const ONBOARDING_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr"];
// Who sees the "Employees" directory link — matches the roles actually
// allowed onto the /users route. Broader than COMPANY_ROLES (which also
// gates Doctors/Medicals/MR Visit Records, not relevant to hr/hr_manager).
const EMPLOYEE_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"];
// Expense claim review (view-all + approve/reject) is reserved for
// company_owner/hr_manager/admin — not hr, matching leave review.
const EXPENSE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager"];

const AdminLayout = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const location = useLocation();
  const canManageCompany = COMPANY_ROLES.includes(role);
  const canViewEmployees = EMPLOYEE_VIEWER_ROLES.includes(role);
  const canSendCompanyMessages = MESSAGE_SENDER_ROLES.includes(role);
  const canReviewLeaves = REVIEWER_ROLES.includes(role);
  const canViewOnboarding = ONBOARDING_VIEWER_ROLES.includes(role);
  const isMr = role === "mr";
  const canManageSalary = ["admin", "company_owner", "hr_manager"].includes(role);
  const canViewSalary = canManageSalary || role === "employee";
  const canReviewExpenses = EXPENSE_APPROVER_ROLES.includes(role);
  const [leavesOpen, setLeavesOpen] = useState(location.pathname.startsWith("/leaves"));
  const [expensesOpen, setExpensesOpen] = useState(location.pathname.startsWith("/expenses"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/leaves")) setLeavesOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/expenses")) setExpensesOpen(true);
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
          <NavLink className={navClass} to={getDashboardRoute(role)} onClick={closeSidebar}><i className="bi bi-grid-1x2"></i> Dashboard</NavLink>
          <NavLink className={navClass} to="/profile" onClick={closeSidebar}><i className="bi bi-person"></i> My Profile</NavLink>
          <NavLink className={navClass} to="/employee/onboarding" onClick={closeSidebar}><i className="bi bi-clipboard2-check"></i> Complete Profile</NavLink>
          {canViewOnboarding && <NavLink className={navClass} to="/employee/profiles" onClick={closeSidebar}><i className="bi bi-people-fill"></i> Onboarding Review</NavLink>}

          <p className="sidebar-label">LEAVE MANAGEMENT</p>
          <button type="button" className={`sidebar-link folder-button ${location.pathname.startsWith("/leaves") ? "active" : ""}`} onClick={() => setLeavesOpen((open) => !open)} aria-expanded={leavesOpen}>
            <i className="bi bi-calendar2-week"></i><span>Leaves</span><i className={`bi ms-auto ${leavesOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </button>
          {leavesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/leaves/apply" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Apply Leave</NavLink>
            <NavLink className={navClass} to="/leaves/my" onClick={closeSidebar}><i className="bi bi-clock-history"></i> My Leave Requests</NavLink>
            {canReviewLeaves && <NavLink className={navClass} to="/leaves/manage" onClick={closeSidebar}><i className="bi bi-clipboard-check"></i> Review Requests</NavLink>}
          </div>}

          <p className="sidebar-label">EXPENSES</p>
          <button type="button" className={`sidebar-link folder-button ${location.pathname.startsWith("/expenses") ? "active" : ""}`} onClick={() => setExpensesOpen((open) => !open)} aria-expanded={expensesOpen}>
            <i className="bi bi-receipt"></i><span>Expenses</span><i className={`bi ms-auto ${expensesOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </button>
          {expensesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/expenses/apply" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Submit Expense</NavLink>
            {canReviewExpenses && <NavLink className={navClass} to="/expenses/manage" onClick={closeSidebar}><i className="bi bi-clipboard-check"></i> Review Expenses</NavLink>}
          </div>}

          {canViewSalary && <><p className="sidebar-label">{canManageSalary ? "SALARY" : "MY SALARY"}</p><NavLink className={navClass} to="/salary/slips" onClick={closeSidebar}><i className="bi bi-receipt"></i> Salary Slips</NavLink>{canManageSalary && <NavLink className={navClass} to="/salary/structures" onClick={closeSidebar}><i className="bi bi-diagram-3"></i> Salary Structures</NavLink>}</>}
          {canViewSalary && <><p className="sidebar-label">{canManageSalary ? "OFFERS" : "MY OFFER"}</p>{canManageSalary && <NavLink className={navClass} to="/offers/create" onClick={closeSidebar}><i className="bi bi-file-earmark-plus"></i> Create Offer</NavLink>}<NavLink className={navClass} to="/offers" onClick={closeSidebar}><i className="bi bi-file-earmark-text"></i> {canManageSalary ? "Offer Letters" : "Offer Details"}</NavLink></>}

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
          <NavLink className={navClass} to="/attendance" onClick={closeSidebar}><i className="bi bi-clock-history"></i> Attendance</NavLink>
          <NavLink className={navClass} to="/calendar" onClick={closeSidebar}><i className="bi bi-calendar3"></i> Calendar</NavLink>
          <NavLink className={navClass} to="/tasks" onClick={closeSidebar}><i className="bi bi-check2-square"></i> Tasks</NavLink>
          {canManageCompany && <NavLink className={navClass} to="/projects" onClick={closeSidebar}><i className="bi bi-kanban"></i> Projects</NavLink>}
          <NavLink className={navClass} to="/orders" onClick={closeSidebar}><i className="bi bi-bag"></i> Orders</NavLink>
          <NavLink className={navClass} to="/notifications" onClick={closeSidebar}><i className="bi bi-bell"></i> Notifications</NavLink>
          {canSendCompanyMessages && <NavLink className={navClass} to="/messages/send" onClick={closeSidebar}><i className="bi bi-send"></i> Send Message</NavLink>}

          {(canViewEmployees || canManageCompany) && <p className="sidebar-label">COMPANY</p>}
          {canViewEmployees && <NavLink className={navClass} to="/users"><i className="bi bi-people"></i> Employees</NavLink>}
          {canManageCompany && <>
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
