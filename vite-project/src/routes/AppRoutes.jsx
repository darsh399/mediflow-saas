import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "../layout/MainLayout";

import Login from "../components/Login";
const lazyPage = (importer) => lazy(importer);
const SuperAdminLogin = lazyPage(() => import("../pages/superadmin/SuperAdminLogin"));
const SuperAdminDashboard = lazyPage(() => import("../pages/superadmin/SuperAdminDashboard"));
const Companies = lazyPage(() => import("../pages/superadmin/Companies"));
const CompanyList = lazyPage(() => import("../pages/superadmin/CompanyList"));
const CompanyDetails = lazyPage(() => import("../pages/superadmin/CompanyDetails"));
const DemoRequests = lazyPage(() => import("../pages/superadmin/DemoRequests"));
const ActivateAccount = lazyPage(() => import("../pages/ActivateAccount"));

import Home from "../components/Home";
import About from "../components/About";
import Contact from "../components/Contact";
import Features from "../components/Features";
import PrivacyPolicy from "../components/Privacy";
import TermsAndConditions from "../components/TermsAndCondition";

import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import GuestRoute from "../components/GuestRoute";

const Doctors = lazyPage(() => import("../pages/admin/Doctors"));
const DoctorEngagement = lazyPage(() => import("../pages/doctors/DoctorEngagement"));
const AddDoctor = lazyPage(() => import("../pages/admin/AddDoctor"));
const DoctorDetails = lazyPage(() => import("../pages/admin/DoctorDetails"));
const Medicals = lazyPage(() => import("../pages/admin/Medicals"));
const AddMedical = lazyPage(() => import("../pages/admin/AddMedical"));
const MedicalDetails = lazyPage(() => import("../pages/admin/MedicalDetails"));
const VisitRecords = lazyPage(() => import("../pages/admin/VisitRecords"));
const TopPerformers = lazyPage(() => import("../pages/admin/TopPerformers"));
const AddVisit = lazyPage(() => import("../pages/mr/AddVisit"));
const DailyCallReport = lazyPage(() => import("../pages/mr/DailyCallReport"));
const TeamCallReports = lazyPage(() => import("../pages/mr/TeamCallReports"));
const Samples = lazyPage(() => import("../pages/samples/Samples"));
const Leaves = lazyPage(() => import("../pages/hr/Leaves"));
const Users = lazyPage(() => import("../pages/admin/Users"));
const AddEmployee = lazyPage(() => import("../pages/admin/AddEmployee"));
const UserDetails = lazyPage(() => import("../pages/admin/UserDetails"));
const AdminDashboard = lazyPage(() => import("../pages/admin/AdminDashboard"));
const Profile = lazyPage(() => import("../pages/profile/Profile"));
const EditProfile = lazyPage(() => import("../pages/profile/EditProfile"));
const ForgotPassword = lazyPage(() => import("../pages/ForgotPassword"));
const ResetPassword = lazyPage(() => import("../pages/ResetPassword"));
const EmployeeOnboarding = lazyPage(() => import("../pages/employee/EmployeeOnboarding"));
const ProfileReviews = lazyPage(() => import("../pages/employee/ProfileReviews"));
const ProfileReviewDetails = lazyPage(() => import("../pages/employee/ProfileReviewDetails"));
const MyVisits = lazyPage(() => import("../pages/employee/MyVisits"));
const Tasks = lazyPage(() => import("../pages/tasks/Tasks"));
const Orders = lazyPage(() => import("../pages/orders/Orders"));
const Notifications = lazyPage(() => import("../pages/notifications/Notifications"));
const Projects = lazyPage(() => import("../pages/projects/Projects"));
const DailyActivity = lazyPage(() => import("../pages/employee/DailyActivity"));
const SendMessage = lazyPage(() => import("../pages/messages/SendMessage"));
const ApplyLeave = lazyPage(() => import("../pages/leaves/ApplyLeaves"));
const MyLeaves = lazyPage(() => import("../pages/leaves/MyLeave"));
const LeaveManagement = lazyPage(() => import("../pages/leaves/LeaveManagement"));
const ApplyExpense = lazyPage(() => import("../pages/expenses/ApplyExpense"));
const ExpenseManagement = lazyPage(() => import("../pages/expenses/ExpenseManagement"));
const Products = lazyPage(() => import("../pages/products/Products"));
const AddProduct = lazyPage(() => import("../pages/products/AddProduct"));
const EditProduct = lazyPage(() => import("../pages/products/EditProduct"));
const ProductDetails = lazyPage(() => import("../pages/products/ProductDetails"));
const AuditLog = lazyPage(() => import("../pages/audit/AuditLog"));
const CompanySettings = lazyPage(() => import("../pages/settings/CompanySettings"));
const ApprovalsInbox = lazyPage(() => import("../pages/approvals/ApprovalsInbox"));
const OrgChart = lazyPage(() => import("../pages/organization/OrgChart"));
const Territories = lazyPage(() => import("../pages/territories/Territories"));
const TerritoryDetail = lazyPage(() => import("../pages/territories/TerritoryDetail"));
const TourPlans = lazyPage(() => import("../pages/tours/TourPlans"));
const TourPlanDetail = lazyPage(() => import("../pages/tours/TourPlanDetail"));
const CoverageReport = lazyPage(() => import("../pages/tours/CoverageReport"));
const SalesTargets = lazyPage(() => import("../pages/sales/SalesTargets"));
const VisitReport = lazyPage(() => import("../pages/reports/VisitReport"));
const ReportsHub = lazyPage(() => import("../pages/reports/ReportsHub"));
const ReportView = lazyPage(() => import("../pages/reports/ReportView"));
const Billing = lazyPage(() => import("../pages/billing/Billing"));
const NotFound = lazyPage(() => import("../pages/NotFound"));
const Attendance = lazyPage(() => import("../pages/attendance/Attendance"));
const EmployeeAttendanceHistory = lazyPage(() => import("../pages/attendance/EmployeeAttendanceHistory"));
const Calendar = lazyPage(() => import("../pages/calendar/Calendar"));
const SalaryPortal = lazyPage(() => import("../pages/salary/SalaryPortal"));
const PayrollRuns = lazyPage(() => import("../pages/salary/PayrollRuns"));
const PayrollRunDetail = lazyPage(() => import("../pages/salary/PayrollRunDetail"));
const AnalyticsDashboard = lazyPage(() => import("../pages/analytics/AnalyticsDashboard"));
const WorkforceShifts = lazyPage(() => import("../pages/workforce/WorkforceShifts"));


const AppRoutes = () => {
    return (
        <Suspense fallback={<div className="container py-5 text-center">Loading page...</div>}>
        <Routes>

            <Route path="/" element={<MainLayout />}>

                {/* ================= PUBLIC ROUTES ================= */}

                {/* Guest-only: an authenticated user is redirected to their
                    role-specific dashboard instead of seeing these pages. */}
                <Route element={<GuestRoute />}>
                    <Route index element={<Home />} />

                    <Route path="login" element={<Login />} />
                </Route>

                <Route
                    path="features"
                    element={<Features />}
                />

                <Route
                    path="privacy"
                    element={<PrivacyPolicy />}
                />

                <Route
                    path="terms"
                    element={<TermsAndConditions />}
                />

                <Route
                    path="forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="reset-password"
                    element={<ResetPassword />}
                />

                <Route
                    path="superadmin/login"
                    element={<SuperAdminLogin />}
                />

                <Route
                    path="activate-account"
                    element={<ActivateAccount />}
                />

                <Route
                    path="about"
                    element={<About />}
                />

                <Route
                    path="contact"
                    element={<Contact />}
                />


                {/* =====================================================
                    DOCTORS & MEDICALS
                    Allowed:
                    admin
                    company_owner
                    manager
                    project_manager
                    mr
                    hr_manager
                ===================================================== */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "mr",
                                "hr_manager"
                            ]}
                        />
                    }
                >
                    <Route element={<AdminLayout />}>
                    <Route path="users" element={<Users/>}/>
                    {/* ================= DOCTORS ================= */}

                    <Route path="doctors">

                        <Route
                            index
                            element={<Doctors />}
                        />

                        <Route
                            path="add"
                            element={<AddDoctor />}
                        />

                        <Route
                            path="engagement"
                            element={<DoctorEngagement />}
                        />

                        <Route
                            path=":id"
                            element={<DoctorDetails />}
                        />

                    </Route>


                    {/* ================= MEDICALS ================= */}

                    <Route path="medicals">

                        <Route
                            index
                            element={<Medicals />}
                        />

                        <Route
                            path="add"
                            element={<AddMedical />}
                        />

                        <Route
                            path=":id"
                            element={<MedicalDetails />}
                        />

                    </Route>
                    </Route>

                </Route>

                <Route element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"]} />}>
                    <Route path="analytics" element={<AdminLayout />}><Route index element={<AnalyticsDashboard />} /></Route>
                </Route>

                <Route element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"]} />}>
                    <Route path="workforce" element={<AdminLayout />}><Route path="shifts" element={<WorkforceShifts />} /></Route>
                </Route>


                {/* ================= SUPER ADMIN ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={["super_admin"]}
                        />
                    }
                >

                    <Route
                        path="superadmin/dashboard"
                        element={<SuperAdminDashboard />}
                    />

                    <Route
                        path="superadmin/companies"
                        element={<Companies />}
                    />

                    <Route
                        path="superadmin/companies/list"
                        element={<CompanyList />}
                    />

                    <Route
                        path="superadmin/companies/:id"
                        element={<CompanyDetails />}
                    />

                    <Route
                        path="superadmin/demo-requests"
                        element={<DemoRequests />}
                    />

                </Route>


                {/* ================= PROFILE ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "employee", "mr", "user"]}
                        />
                    }
                >
                    <Route path="calendar" element={<AdminLayout />}>
                        <Route index element={<Calendar />} />
                    </Route>
                </Route>

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >
                    <Route path="attendance" element={<AdminLayout />}>
                        <Route index element={<Attendance />} />
                        <Route path=":employeeId" element={<EmployeeAttendanceHistory />} />
                    </Route>
                </Route>

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="profile"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Profile />}
                        />

                        <Route
                            path="edit"
                            element={<EditProfile />}
                        />

                    </Route>

                </Route>


                {/* ================= EMPLOYEE ONBOARDING ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="employee/onboarding"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<EmployeeOnboarding />}
                        />

                    </Route>

                </Route>


                {/* ================= MY VISITS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="employee/visits"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<MyVisits />}
                        />

                    </Route>

                </Route>


                {/* ================= PROFILE REVIEWS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="employee/profiles"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<ProfileReviews />}
                        />

                        <Route
                            path=":id"
                            element={<ProfileReviewDetails />}
                        />

                    </Route>

                </Route>


                {/* ================= NOTIFICATIONS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="notifications"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Notifications />}
                        />

                    </Route>

                </Route>

                {/* ================= COMPANY MESSAGES ================= */}
                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager"]} />}
                >
                    <Route path="messages" element={<AdminLayout />}>
                        <Route path="send" element={<SendMessage />} />
                    </Route>
                </Route>


                {/* ================= SALES TARGETS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >
                    <Route path="sales" element={<AdminLayout />}>
                        <Route index element={<SalesTargets />} />
                    </Route>
                    <Route path="reports" element={<AdminLayout />}>
                        <Route path="visits" element={<VisitReport />} />
                    </Route>
                </Route>

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >
                    <Route path="reports" element={<AdminLayout />}>
                        <Route index element={<ReportsHub />} />
                        <Route path=":type" element={<ReportView />} />
                    </Route>
                </Route>


                {/* ================= TOUR PLANS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >
                    <Route path="tours" element={<AdminLayout />}>
                        <Route index element={<TourPlans />} />
                        <Route path=":id" element={<TourPlanDetail />} />
                    </Route>
                </Route>

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >
                    <Route path="tours" element={<AdminLayout />}>
                        <Route path="coverage" element={<CoverageReport />} />
                    </Route>
                </Route>


                {/* ================= TERRITORIES ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="territories"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Territories />}
                        />

                        <Route
                            path=":id"
                            element={<TerritoryDetail />}
                        />

                    </Route>

                </Route>


                {/* ================= ORGANIZATION CHART ================= */}

                {/* The reporting chart is company-wide context every member can
                    see — same visibility as the calendar. */}
                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr",
                                "user"
                            ]}
                        />
                    }
                >

                    <Route
                        path="organization"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<OrgChart />}
                        />

                    </Route>

                </Route>


                {/* ================= APPROVALS INBOX ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="approvals"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<ApprovalsInbox />}
                        />

                    </Route>

                </Route>


                {/* ================= TASKS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="tasks"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Tasks />}
                        />

                    </Route>

                </Route>


                {/* ================= PROJECTS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="projects"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Projects />}
                        />

                    </Route>

                </Route>


                {/* ================= ORDERS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="orders"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<Orders />}
                        />

                    </Route>

                </Route>


                {/* ================= DAILY ACTIVITY ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager",
                                "employee",
                                "mr"
                            ]}
                        />
                    }
                >

                    <Route
                        path="employee/activity"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<DailyActivity />}
                        />

                    </Route>

                </Route>


                {/* ================= ADMIN AREA ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "admin",
                                "company_owner",
                                "hr_manager",
                                "hr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="admin"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<AdminDashboard />}
                        />

                        <Route
                            path="visits"
                            element={<VisitRecords />}
                        />

                        <Route
                            path="visits/:employeeId"
                            element={<VisitRecords />}
                        />

                        <Route
                            path="top-performers"
                            element={<TopPerformers />}
                        />

                        <Route
                            path="users/add"
                            element={<AddEmployee />}
                        />

                        <Route
                            path="users/:id"
                            element={<UserDetails />}
                        />

                        <Route
                            path="profile"
                            element={<Profile />}
                        />

                        <Route
                            path="profile/edit"
                            element={<EditProfile />}
                        />

                    </Route>

                </Route>

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager"]} />}
                >
                    <Route path="employee/profile/:id" element={<AdminLayout />}>
                        <Route index element={<UserDetails />} />
                    </Route>
                </Route>


                {/* ================= MR DOCTORS ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={["mr"]}
                        />
                    }
                >

                    <Route
                        path="mr"
                        element={<AdminLayout />}
                    >

                        <Route
                            path="doctors"
                            element={<Doctors />}
                        />

                        <Route
                            path="doctors/add"
                            element={<AddDoctor />}
                        />

                    </Route>

                </Route>


                {/* ================= MR AREA ================= */}

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "employee",
                                "mr",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="mr"
                        element={<AdminLayout />}
                    >

                        <Route
                            path="add-visit"
                            element={<AddVisit />}
                        />

                        <Route
                            path="dcr"
                            element={<DailyCallReport />}
                        />

                    </Route>

                </Route>

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "manager", "project_manager"]} />}
                >
                    <Route path="dcr" element={<AdminLayout />}>
                        <Route path="team" element={<TeamCallReports />} />
                    </Route>
                </Route>

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "manager", "project_manager", "employee", "mr"]} />}
                >
                    <Route path="samples" element={<AdminLayout />}>
                        <Route index element={<Samples />} />
                    </Route>
                </Route>


                {/* ================= HR AREA ================= */}

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"]} />}
                >
                    <Route path="leaves" element={<AdminLayout />}>
                        <Route path="apply" element={<ApplyLeave />} />
                        <Route path="my" element={<MyLeaves />} />
                    </Route>
                </Route>

                {/* Leave review (view-all + approve/reject) is reserved for
                    hr_manager/company_owner/admin/people managers — not hr. */}
                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "manager", "project_manager"]} />}
                >
                    <Route path="leaves" element={<AdminLayout />}>
                        <Route path="manage" element={<LeaveManagement />} />
                    </Route>
                </Route>

                {/* ================= EXPENSES ================= */}

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"]} />}
                >
                    <Route path="expenses" element={<AdminLayout />}>
                        <Route path="apply" element={<ApplyExpense />} />
                    </Route>
                </Route>

                {/* Expense review (view-all + approve/reject) is reserved for
                    company_owner/hr_manager/admin — not hr. */}
                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager"]} />}
                >
                    <Route path="expenses" element={<AdminLayout />}>
                        <Route path="manage" element={<ExpenseManagement />} />
                    </Route>
                </Route>

                {/* ================= COMPANY PRODUCTS ================= */}

                {/* Everyone with company context can view the catalog. */}
                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"]} />}
                >
                    <Route path="products" element={<AdminLayout />}>
                        <Route index element={<Products />} />
                        <Route path=":id" element={<ProductDetails />} />
                    </Route>
                </Route>

                {/* Add/Edit is reserved for company_owner/hr_manager/admin — not hr. */}
                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager"]} />}
                >
                    <Route path="products" element={<AdminLayout />}>
                        <Route path="add" element={<AddProduct />} />
                        <Route path=":id/edit" element={<EditProduct />} />
                    </Route>
                </Route>

                {/* ================= AUDIT LOG ================= */}

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager"]} />}
                >
                    <Route path="audit-log" element={<AdminLayout />}>
                        <Route index element={<AuditLog />} />
                    </Route>
                    <Route path="settings" element={<AdminLayout />}>
                        <Route index element={<CompanySettings />} />
                    </Route>
                </Route>

                {/* ================= BILLING ================= */}

                <Route
                    element={<ProtectedRoute rolesAllowed={["admin", "company_owner"]} />}
                >
                    <Route path="billing" element={<AdminLayout />}>
                        <Route index element={<Billing />} />
                    </Route>
                </Route>

                <Route
                    element={
                        <ProtectedRoute
                            rolesAllowed={[
                                "hr",
                                "hr_manager",
                                "admin",
                                "company_owner",
                                "manager",
                                "project_manager"
                            ]}
                        />
                    }
                >

                    <Route
                        path="hr"
                        element={<AdminLayout />}
                    >

                        <Route
                            path="leaves"
                            element={<Leaves />}
                        />

                    </Route>

                </Route>

                <Route element={<ProtectedRoute rolesAllowed={["admin", "company_owner", "hr_manager", "employee"]} />}>
                    <Route path="salary" element={<AdminLayout />}>
                        <Route path="slips" element={<SalaryPortal mode="slips" />} />
                        <Route path="structures" element={<SalaryPortal mode="structures" />} />
                        <Route path="runs" element={<PayrollRuns />} />
                        <Route path="runs/:id" element={<PayrollRunDetail />} />
                    </Route>
                    <Route path="offers" element={<AdminLayout />}>
                        <Route index element={<SalaryPortal mode="offers" />} />
                        <Route path="create" element={<SalaryPortal mode="offers" />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />


            </Route>

        </Routes>
        </Suspense>
    );
};

export default AppRoutes;
