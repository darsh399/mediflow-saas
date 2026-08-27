import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardRoute } from "../utils/dashboardRoute";
import { useApprovals } from "../hooks/useApprovals";

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
// Everyone with company context can view the product catalog; adding
// products is gated in-page by the Products list itself.
const PRODUCT_VIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"];
// Matches the audit.view permission (company_owner/hr_manager/admin only).
const AUDIT_VIEWER_ROLES = ["admin", "company_owner", "hr_manager"];
// Matches the subscription.view permission (company_owner/admin only).
const BILLING_VIEWER_ROLES = ["admin", "company_owner"];
// Company owner and HR only, per the visit.view permission scope used for
// the top-performers leaderboard (broader than COMPANY_ROLES, which is
// manager/project_manager focused and excludes hr_manager).
const TOP_PERFORMER_ROLES = ["admin", "company_owner", "hr_manager"];

const AdminLayout = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const location = useLocation();
  const { total: approvalsCount, active: hasApprovals } = useApprovals();
  const canManageCompany = COMPANY_ROLES.includes(role);
  const canViewEmployees = EMPLOYEE_VIEWER_ROLES.includes(role);
  const canSendCompanyMessages = MESSAGE_SENDER_ROLES.includes(role);
  const canReviewLeaves = REVIEWER_ROLES.includes(role);
  const canViewOnboarding = ONBOARDING_VIEWER_ROLES.includes(role);
  const isMr = role === "mr";
  const canManageSalary = ["admin", "company_owner", "hr_manager"].includes(role);
  const canViewSalary = canManageSalary || role === "employee";
  const canReviewExpenses = EXPENSE_APPROVER_ROLES.includes(role);
  const canViewProducts = PRODUCT_VIEWER_ROLES.includes(role);
  const canViewAuditLog = AUDIT_VIEWER_ROLES.includes(role);
  const canViewBilling = BILLING_VIEWER_ROLES.includes(role);
  const canViewTopPerformers = TOP_PERFORMER_ROLES.includes(role);
  const isPayrollPath = (pathname) => pathname.startsWith("/salary") || pathname.startsWith("/offers");
  const isMrToolsPath = (pathname) => pathname.startsWith("/doctors") || pathname.startsWith("/medicals") || pathname.startsWith("/mr/") || pathname.startsWith("/employee/visits") || pathname.startsWith("/users");
  const isCompanyPath = (pathname) => pathname.startsWith("/users") || pathname.startsWith("/doctors") || pathname.startsWith("/medicals") || pathname.startsWith("/admin/visits") || pathname.startsWith("/admin/top-performers") || pathname.startsWith("/territories");
  const isInsightsPath = (pathname) => pathname.startsWith("/audit-log") || pathname.startsWith("/billing");

  const [leavesOpen, setLeavesOpen] = useState(location.pathname.startsWith("/leaves"));
  const [expensesOpen, setExpensesOpen] = useState(location.pathname.startsWith("/expenses"));
  const [productsOpen, setProductsOpen] = useState(location.pathname.startsWith("/products"));
  const [payrollOpen, setPayrollOpen] = useState(isPayrollPath(location.pathname));
  const [mrToolsOpen, setMrToolsOpen] = useState(isMrToolsPath(location.pathname));
  const [companyOpen, setCompanyOpen] = useState(isCompanyPath(location.pathname));
  const [insightsOpen, setInsightsOpen] = useState(isInsightsPath(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/leaves")) setLeavesOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/expenses")) setExpensesOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/products")) setProductsOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isPayrollPath(location.pathname)) setPayrollOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isMrToolsPath(location.pathname)) setMrToolsOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isCompanyPath(location.pathname)) setCompanyOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isInsightsPath(location.pathname)) setInsightsOpen(true);
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

  // Keep the mobile drawer in sync with browser back/forward navigation —
  // without this, using the back button while the drawer is open leaves it
  // open over the new page.
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
          {hasApprovals && <NavLink className={navClass} to="/approvals" onClick={closeSidebar}><i className="bi bi-inbox"></i> Approvals{approvalsCount > 0 && <span className="badge rounded-pill bg-danger ms-auto">{approvalsCount > 99 ? "99+" : approvalsCount}</span>}</NavLink>}

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

          {canViewProducts && <><p className="sidebar-label">PRODUCTS</p>
            <button type="button" className={`sidebar-link folder-button ${location.pathname.startsWith("/products") ? "active" : ""}`} onClick={() => setProductsOpen((open) => !open)} aria-expanded={productsOpen}>
              <i className="bi bi-capsule"></i><span>Products</span><i className={`bi ms-auto ${productsOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
            {productsOpen && <div className="sidebar-submenu">
              <NavLink className={navClass} to="/products" end onClick={closeSidebar}><i className="bi bi-grid"></i> All Products</NavLink>
            </div>}
          </>}

          {canViewSalary && <><p className="sidebar-label">{canManageSalary ? "PAYROLL" : "MY PAYROLL"}</p>
            <button type="button" className={`sidebar-link folder-button ${isPayrollPath(location.pathname) ? "active" : ""}`} onClick={() => setPayrollOpen((open) => !open)} aria-expanded={payrollOpen}>
              <i className="bi bi-cash-stack"></i><span>{canManageSalary ? "Salary & Offers" : "Salary & Offer"}</span><i className={`bi ms-auto ${payrollOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
            {payrollOpen && <div className="sidebar-submenu">
              <NavLink className={navClass} to="/salary/slips" onClick={closeSidebar}><i className="bi bi-receipt"></i> Salary Slips</NavLink>
              {canManageSalary && <NavLink className={navClass} to="/salary/structures" onClick={closeSidebar}><i className="bi bi-diagram-3"></i> Salary Structures</NavLink>}
              {canManageSalary && <NavLink className={navClass} to="/offers/create" onClick={closeSidebar}><i className="bi bi-file-earmark-plus"></i> Create Offer</NavLink>}
              <NavLink className={navClass} to="/offers" onClick={closeSidebar}><i className="bi bi-file-earmark-text"></i> {canManageSalary ? "Offer Letters" : "Offer Details"}</NavLink>
            </div>}
          </>}

          {isMr && <><p className="sidebar-label">MR TOOLS</p>
            <button type="button" className={`sidebar-link folder-button ${isMrToolsPath(location.pathname) ? "active" : ""}`} onClick={() => setMrToolsOpen((open) => !open)} aria-expanded={mrToolsOpen}>
              <i className="bi bi-briefcase"></i><span>Field Tools</span><i className={`bi ms-auto ${mrToolsOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
            {mrToolsOpen && <div className="sidebar-submenu">
              <NavLink className={navClass} to="/users" onClick={closeSidebar}><i className="bi bi-people"></i> Employees</NavLink>
              <NavLink className={navClass} to="/doctors" onClick={closeSidebar}><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
              <NavLink className={navClass} to="/mr/add-visit" onClick={closeSidebar}><i className="bi bi-geo-alt"></i> Add Visit</NavLink>
              <NavLink className={navClass} to="/employee/visits" onClick={closeSidebar}><i className="bi bi-map"></i> My Visits</NavLink>
              <NavLink className={navClass} to="/medicals" onClick={closeSidebar}><i className="bi bi-hospital"></i> Medicals</NavLink>
            </div>}
          </>}

          <p className="sidebar-label">WORK</p>
          <NavLink className={navClass} to="/attendance" onClick={closeSidebar}><i className="bi bi-clock-history"></i> Attendance</NavLink>
          <NavLink className={navClass} to="/calendar" onClick={closeSidebar}><i className="bi bi-calendar3"></i> Calendar</NavLink>
          <NavLink className={navClass} to="/organization" onClick={closeSidebar}><i className="bi bi-diagram-3"></i> Org Chart</NavLink>
          <NavLink className={navClass} to="/tours" onClick={closeSidebar}><i className="bi bi-signpost-split"></i> Tour Plans</NavLink>
          <NavLink className={navClass} to="/tasks" onClick={closeSidebar}><i className="bi bi-check2-square"></i> Tasks</NavLink>
          {canManageCompany && <NavLink className={navClass} to="/projects" onClick={closeSidebar}><i className="bi bi-kanban"></i> Projects</NavLink>}
          <NavLink className={navClass} to="/orders" onClick={closeSidebar}><i className="bi bi-bag"></i> Orders</NavLink>
          <NavLink className={navClass} to="/sales" onClick={closeSidebar}><i className="bi bi-graph-up-arrow"></i> Sales Target</NavLink>
          <NavLink className={navClass} to="/reports/visits" onClick={closeSidebar}><i className="bi bi-clipboard-data"></i> Visit Report</NavLink>
          <NavLink className={navClass} to="/notifications" onClick={closeSidebar}><i className="bi bi-bell"></i> Notifications</NavLink>
          {canSendCompanyMessages && <NavLink className={navClass} to="/messages/send" onClick={closeSidebar}><i className="bi bi-send"></i> Send Message</NavLink>}

          {(canViewEmployees || canManageCompany || canViewTopPerformers) && <><p className="sidebar-label">COMPANY</p>
            <button type="button" className={`sidebar-link folder-button ${isCompanyPath(location.pathname) ? "active" : ""}`} onClick={() => setCompanyOpen((open) => !open)} aria-expanded={companyOpen}>
              <i className="bi bi-building"></i><span>Company</span><i className={`bi ms-auto ${companyOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
            {companyOpen && <div className="sidebar-submenu">
              {canViewEmployees && <NavLink className={navClass} to="/users" onClick={closeSidebar}><i className="bi bi-people"></i> Employees</NavLink>}
              {canManageCompany && <>
                <NavLink className={navClass} to="/doctors" onClick={closeSidebar}><i className="bi bi-heart-pulse"></i> Doctors</NavLink>
                <NavLink className={navClass} to="/medicals" onClick={closeSidebar}><i className="bi bi-hospital"></i> Medicals</NavLink>
                <NavLink className={navClass} to="/territories" onClick={closeSidebar}><i className="bi bi-geo"></i> Territories</NavLink>
                <NavLink className={navClass} to="/admin/visits" onClick={closeSidebar}><i className="bi bi-clipboard-data"></i> MR Visit Records</NavLink>
              </>}
              {canViewTopPerformers && <NavLink className={navClass} to="/admin/top-performers" onClick={closeSidebar}><i className="bi bi-trophy"></i> Top Performers</NavLink>}
            </div>}
          </>}

          {(canViewAuditLog || canViewBilling) && <><p className="sidebar-label">INSIGHTS</p>
            <button type="button" className={`sidebar-link folder-button ${isInsightsPath(location.pathname) ? "active" : ""}`} onClick={() => setInsightsOpen((open) => !open)} aria-expanded={insightsOpen}>
              <i className="bi bi-graph-up"></i><span>Reports</span><i className={`bi ms-auto ${insightsOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
            {insightsOpen && <div className="sidebar-submenu">
              {canViewAuditLog && <NavLink className={navClass} to="/audit-log" onClick={closeSidebar}><i className="bi bi-clock-history"></i> Audit Log</NavLink>}
              {canViewBilling && <NavLink className={navClass} to="/billing" onClick={closeSidebar}><i className="bi bi-credit-card"></i> Billing</NavLink>}
            </div>}
          </>}
        </nav>
      </aside>
      <main className="app-content"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
