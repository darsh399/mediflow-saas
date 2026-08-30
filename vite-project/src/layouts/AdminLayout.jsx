import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardRoute } from "../utils/dashboardRoute";
import { useApprovals } from "../hooks/useApprovals";

// ---------------------------------------------------------------------------
// Role sets — unchanged from before. Each nav link is gated by exactly the
// same rule it was; this rewrite only regroups the links and removes the
// Doctors / Employees entries that were duplicated across two groups.
//
// "Add X" is NOT a sidebar entry — every list page (Doctors, Employees,
// Medicals, Products) already has its own Add button. The sidebar navigates
// to areas; contextual create actions stay on the page.
// ---------------------------------------------------------------------------
const REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const COMPANY_ROLES = ["admin", "company_owner", "manager", "project_manager"];
const MESSAGE_SENDER_ROLES = ["admin", "company_owner", "hr_manager"];
const ONBOARDING_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr"];
const EMPLOYEE_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"];
const EXPENSE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager"];
const PRODUCT_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"];
const AUDIT_VIEWER_ROLES = ["admin", "company_owner", "hr_manager"];
const BILLING_VIEWER_ROLES = ["admin", "company_owner"];
const TOP_PERFORMER_ROLES = ["admin", "company_owner", "hr_manager"];
const REPORT_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"];
// Doctor Excel import — Company Owner / HR Manager only (matches the backend).
const DOCTOR_IMPORT_ROLES = ["admin", "company_owner", "hr_manager"];

const AdminLayout = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const location = useLocation();
  const { total: approvalsCount, active: hasApprovals } = useApprovals();

  const isMr = role === "mr";
  const canManageCompany = COMPANY_ROLES.includes(role);
  // MRs can open the employee directory (read-only) — the /users route allows
  // them and the old sidebar surfaced it under "MR Tools".
  const canViewEmployees = EMPLOYEE_VIEWER_ROLES.includes(role) || role === "mr";
  const canSendCompanyMessages = MESSAGE_SENDER_ROLES.includes(role);
  const canReviewLeaves = REVIEWER_ROLES.includes(role);
  const canViewOnboarding = ONBOARDING_VIEWER_ROLES.includes(role);
  const canManageSalary = ["admin", "company_owner", "hr_manager"].includes(role);
  const canViewSalary = canManageSalary || role === "employee";
  const canReviewExpenses = EXPENSE_APPROVER_ROLES.includes(role);
  const canViewProducts = PRODUCT_VIEWER_ROLES.includes(role);
  const canViewAuditLog = AUDIT_VIEWER_ROLES.includes(role);
  const canViewBilling = BILLING_VIEWER_ROLES.includes(role);
  const canViewTopPerformers = TOP_PERFORMER_ROLES.includes(role);
  const canViewReports = REPORT_VIEWER_ROLES.includes(role);
  const canImportDoctors = DOCTOR_IMPORT_ROLES.includes(role);

  // The Doctors area is reachable by field + management roles; hr_manager also
  // gets it now purely so they can run the Excel import.
  const canSeeMedicals = isMr || canManageCompany;
  const canSeeDoctors = canSeeMedicals || canImportDoctors;
  const canSeeVisits = isMr || canManageCompany;
  const canSeeFieldGroup = canSeeDoctors || canSeeVisits || canManageCompany;
  const canSeeCompanyGroup = canViewTopPerformers || canViewAuditLog || canViewBilling || canSendCompanyMessages;

  const startsWith = (prefix) => location.pathname.startsWith(prefix);

  const [visitsOpen, setVisitsOpen] = useState(startsWith("/mr/") || startsWith("/employee/visits") || startsWith("/admin/visits"));
  const [leavesOpen, setLeavesOpen] = useState(startsWith("/leaves"));
  const [expensesOpen, setExpensesOpen] = useState(startsWith("/expenses"));
  const [payrollOpen, setPayrollOpen] = useState(startsWith("/salary") || startsWith("/offers"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep the relevant folder open when navigating directly to one of its pages.
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith("/mr/") || p.startsWith("/employee/visits") || p.startsWith("/admin/visits")) setVisitsOpen(true);
    if (p.startsWith("/leaves")) setLeavesOpen(true);
    if (p.startsWith("/expenses")) setExpensesOpen(true);
    if (p.startsWith("/salary") || p.startsWith("/offers")) setPayrollOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    const toggleSidebar = () => setSidebarOpen((open) => !open);
    const closeSidebarEvent = () => setSidebarOpen(false);
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const handleBreakpoint = (event) => { if (event.matches) setSidebarOpen(false); };
    window.addEventListener("mediflow:toggle-sidebar", toggleSidebar);
    window.addEventListener("mediflow:close-sidebar", closeSidebarEvent);
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => {
      window.removeEventListener("mediflow:toggle-sidebar", toggleSidebar);
      window.removeEventListener("mediflow:close-sidebar", closeSidebarEvent);
      mediaQuery.removeEventListener("change", handleBreakpoint);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mf-drawer-open", sidebarOpen);
    return () => document.body.classList.remove("mf-drawer-open");
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleEscape = (event) => { if (event.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  const navClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;
  const closeSidebar = () => setSidebarOpen(false);

  const folder = (label, icon, open, setOpen, activePrefixes) => {
    const active = activePrefixes.some((prefix) => location.pathname.startsWith(prefix));
    return (
      <button
        type="button"
        className={`sidebar-link folder-button ${active ? "active" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <i className={`bi ${icon}`}></i>
        <span>{label}</span>
        <i className={`bi ms-auto ${open ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
      </button>
    );
  };

  return (
    <div className="app-shell">
      {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />}
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`} aria-label="Workspace navigation">
        <div className="sidebar-brand">
          <span className="brand-icon">M</span>
          <span><strong>MediFlow</strong><small>Workspace</small></span>
          <button type="button" className="sidebar-close" aria-label="Close navigation" onClick={closeSidebar}><i className="bi bi-x-lg"></i></button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {/* ---- WORKSPACE ---- */}
          <p className="sidebar-label">WORKSPACE</p>
          <NavLink className={navClass} to={getDashboardRoute(role)} onClick={closeSidebar}><i className="bi bi-grid-1x2"></i> Dashboard</NavLink>
          <NavLink className={navClass} to="/profile" onClick={closeSidebar}><i className="bi bi-person"></i> My Profile</NavLink>
          <NavLink className={navClass} to="/employee/onboarding" onClick={closeSidebar}><i className="bi bi-clipboard2-check"></i> Complete Profile</NavLink>
          {canViewOnboarding && <NavLink className={navClass} to="/employee/profiles" onClick={closeSidebar}><i className="bi bi-people-fill"></i> Onboarding Review</NavLink>}
          {hasApprovals && <NavLink className={navClass} to="/approvals" onClick={closeSidebar}><i className="bi bi-inbox"></i> Approvals{approvalsCount > 0 && <span className="badge rounded-pill bg-danger ms-auto">{approvalsCount > 99 ? "99+" : approvalsCount}</span>}</NavLink>}
          <NavLink className={navClass} to="/calendar" onClick={closeSidebar}><i className="bi bi-calendar3"></i> Calendar</NavLink>
          <NavLink className={navClass} to="/tasks" onClick={closeSidebar}><i className="bi bi-check2-square"></i> Tasks</NavLink>
          <NavLink className={navClass} to="/notifications" onClick={closeSidebar}><i className="bi bi-bell"></i> Notifications</NavLink>

          {/* ---- FIELD ---- */}
          {canSeeFieldGroup && <>
            <p className="sidebar-label">FIELD</p>
            {canSeeDoctors && <NavLink end className={navClass} to="/doctors" onClick={closeSidebar}><i className="bi bi-heart-pulse"></i> Doctors</NavLink>}
            {canSeeDoctors && <NavLink className={navClass} to="/doctors/engagement" onClick={closeSidebar}><i className="bi bi-graph-up-arrow"></i> Doctor Engagement</NavLink>}
            {canSeeMedicals && <NavLink end className={navClass} to="/medicals" onClick={closeSidebar}><i className="bi bi-hospital"></i> Medicals</NavLink>}

            {canSeeVisits && <>
              {folder("Visits", "bi-geo-alt", visitsOpen, setVisitsOpen, ["/mr/", "/employee/visits", "/admin/visits"])}
              {visitsOpen && <div className="sidebar-submenu">
                {isMr && <NavLink className={navClass} to="/mr/add-visit" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Add Visit</NavLink>}
                <NavLink className={navClass} to="/employee/visits" onClick={closeSidebar}><i className="bi bi-map"></i> My Visits</NavLink>
                {canManageCompany && <NavLink className={navClass} to="/admin/visits" onClick={closeSidebar}><i className="bi bi-clipboard-data"></i> MR Visit Records</NavLink>}
              </div>}
            </>}

            {canManageCompany && <NavLink className={navClass} to="/territories" onClick={closeSidebar}><i className="bi bi-geo"></i> Territories</NavLink>}
          </>}

          {/* ---- SALES & ACTIVITY ---- */}
          <p className="sidebar-label">SALES &amp; ACTIVITY</p>
          <NavLink className={navClass} to="/sales" onClick={closeSidebar}><i className="bi bi-graph-up-arrow"></i> Sales Targets</NavLink>
          <NavLink className={navClass} to="/orders" onClick={closeSidebar}><i className="bi bi-bag"></i> Orders</NavLink>
          <NavLink className={navClass} to="/tours" onClick={closeSidebar}><i className="bi bi-signpost-split"></i> Tour Plans</NavLink>
          {canViewProducts && <NavLink end className={navClass} to="/products" onClick={closeSidebar}><i className="bi bi-capsule"></i> Products</NavLink>}
          {canViewReports
            ? <NavLink className={navClass} to="/reports" onClick={closeSidebar}><i className="bi bi-bar-chart-line"></i> Reports</NavLink>
            : <NavLink className={navClass} to="/reports/visits" onClick={closeSidebar}><i className="bi bi-clipboard-data"></i> Visit Report</NavLink>}

          {/* ---- PEOPLE ---- */}
          <p className="sidebar-label">PEOPLE</p>
          {canViewEmployees && <NavLink end className={navClass} to="/users" onClick={closeSidebar}><i className="bi bi-people"></i> Employees</NavLink>}
          {canManageCompany && <NavLink className={navClass} to="/projects" onClick={closeSidebar}><i className="bi bi-kanban"></i> Projects</NavLink>}
          <NavLink className={navClass} to="/organization" onClick={closeSidebar}><i className="bi bi-diagram-3"></i> Org Chart</NavLink>
          <NavLink className={navClass} to="/attendance" onClick={closeSidebar}><i className="bi bi-clock-history"></i> Attendance</NavLink>

          {folder("Leave", "bi-calendar2-week", leavesOpen, setLeavesOpen, ["/leaves"])}
          {leavesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/leaves/apply" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Apply Leave</NavLink>
            <NavLink className={navClass} to="/leaves/my" onClick={closeSidebar}><i className="bi bi-clock-history"></i> My Leave Requests</NavLink>
            {canReviewLeaves && <NavLink className={navClass} to="/leaves/manage" onClick={closeSidebar}><i className="bi bi-clipboard-check"></i> Review Requests</NavLink>}
          </div>}

          {folder("Expenses", "bi-receipt", expensesOpen, setExpensesOpen, ["/expenses"])}
          {expensesOpen && <div className="sidebar-submenu">
            <NavLink className={navClass} to="/expenses/apply" onClick={closeSidebar}><i className="bi bi-plus-circle"></i> Submit Expense</NavLink>
            {canReviewExpenses && <NavLink className={navClass} to="/expenses/manage" onClick={closeSidebar}><i className="bi bi-clipboard-check"></i> Review Expenses</NavLink>}
          </div>}

          {/* ---- PAYROLL ---- */}
          {canViewSalary && <>
            <p className="sidebar-label">{canManageSalary ? "PAYROLL" : "MY PAYROLL"}</p>
            {folder(canManageSalary ? "Salary & Offers" : "Salary & Offer", "bi-cash-stack", payrollOpen, setPayrollOpen, ["/salary", "/offers"])}
            {payrollOpen && <div className="sidebar-submenu">
              <NavLink className={navClass} to="/salary/slips" onClick={closeSidebar}><i className="bi bi-receipt"></i> Salary Slips</NavLink>
              {canManageSalary && <NavLink className={navClass} to="/salary/runs" onClick={closeSidebar}><i className="bi bi-cash-coin"></i> Payroll Runs</NavLink>}
              {canManageSalary && <NavLink className={navClass} to="/salary/structures" onClick={closeSidebar}><i className="bi bi-diagram-3"></i> Salary Structures</NavLink>}
              <NavLink className={navClass} to="/offers" onClick={closeSidebar}><i className="bi bi-file-earmark-text"></i> {canManageSalary ? "Offer Letters" : "Offer Details"}</NavLink>
              {canManageSalary && <NavLink className={navClass} to="/offers/create" onClick={closeSidebar}><i className="bi bi-file-earmark-plus"></i> Create Offer</NavLink>}
            </div>}
          </>}

          {/* ---- COMPANY ---- */}
          {canSeeCompanyGroup && <>
            <p className="sidebar-label">COMPANY</p>
            {canViewTopPerformers && <NavLink className={navClass} to="/admin/top-performers" onClick={closeSidebar}><i className="bi bi-trophy"></i> Top Performers</NavLink>}
            {canViewAuditLog && <NavLink className={navClass} to="/audit-log" onClick={closeSidebar}><i className="bi bi-clock-history"></i> Audit Log</NavLink>}
            {canViewBilling && <NavLink className={navClass} to="/billing" onClick={closeSidebar}><i className="bi bi-credit-card"></i> Billing</NavLink>}
            {canSendCompanyMessages && <NavLink className={navClass} to="/messages/send" onClick={closeSidebar}><i className="bi bi-send"></i> Send Message</NavLink>}
          </>}
        </nav>
      </aside>
      <main className="app-content"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
