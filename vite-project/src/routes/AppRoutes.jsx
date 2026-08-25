// import { Routes, Route } from "react-router-dom";

// import MainLayout from "../layout/MainLayout";

// import Login from "../components/Login";
// import Signup from "../components/SignUp";
// import SuperAdminLogin from "../pages/superadmin/SuperAdminLogin";

// import SuperAdminDashboard from "../pages/superadmin/SuperAdminDashboard";
// import Companies from "../pages/superadmin/Companies";
// import CompanyList from "../pages/superadmin/CompanyList";
// import CompanyDetails from "../pages/superadmin/CompanyDetails";

// import ActivateAccount from "../pages/ActivateAccount";

// import Home from "../components/Home";
// import About from "../components/About";
// import Contact from "../components/Contact";

// import AdminLayout from "../layouts/AdminLayout";
// import ProtectedRoute from "../components/ProtectedRoute";

// import Doctors from "../pages/admin/Doctors";
// import AddDoctor from "../pages/admin/AddDoctor";

// import Medicals from "../pages/admin/Medicals";
// import AddMedical from "../pages/admin/AddMedical";

// import Visits from "../pages/admin/Visits";

// import AddVisit from "../pages/mr/AddVisit";

// import Leaves from "../pages/hr/Leaves";

// import Users from "../pages/admin/Users";
// import AddEmployee from "../pages/admin/AddEmployee";
// import UserDetails from "../pages/admin/UserDetails";

// import AdminDashboard from "../pages/admin/AdminDashboard";

// import Profile from "../pages/profile/Profile";
// import EditProfile from "../pages/profile/EditProfile";

// import ForgotPassword from "../pages/ForgotPassword";
// import ResetPassword from "../pages/ResetPassword";

// import EmployeeOnboarding from "../pages/employee/EmployeeOnboarding";
// import ProfileReviews from "../pages/employee/ProfileReviews";
// import ProfileReviewDetails from "../pages/employee/ProfileReviewDetails";
// import MyVisits from "../pages/employee/MyVisits";

// import Tasks from "../pages/tasks/Tasks";
// import Orders from "../pages/orders/Orders";
// import Notifications from "../pages/notifications/Notifications";
// import Projects from "../pages/projects/Projects";

// import DailyActivity from "../pages/employee/DailyActivity";


// const AppRoutes = () => {
//     return (
//         <Routes>

//             <Route path="/" element={<MainLayout />}>

//                 {/* ================= PUBLIC ROUTES ================= */}

//                 <Route index element={<Home />} />

//                 <Route path="login" element={<Login />} />

//                 <Route path="signup" element={<Signup />} />

//                 <Route
//                     path="forgot-password"
//                     element={<ForgotPassword />}
//                 />

//                 <Route
//                     path="reset-password"
//                     element={<ResetPassword />}
//                 />

//                 <Route
//                     path="superadmin/login"
//                     element={<SuperAdminLogin />}
//                 />

//                 <Route
//                     path="activate-account"
//                     element={<ActivateAccount />}
//                 />

//                  <Route
//                             path="users"
//                             element={<Users />}
//                         />

//                 <Route path="about" element={<About />} />

//                 <Route path="contact" element={<Contact />} />


//                 {/* ================= SUPER ADMIN ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={["super_admin"]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="superadmin/dashboard"
//                         element={<SuperAdminDashboard />}
//                     />

//                     <Route
//                         path="superadmin/companies"
//                         element={<Companies />}
//                     />

//                     <Route
//                         path="superadmin/companies/list"
//                         element={<CompanyList />}
//                     />

//                     <Route
//                         path="superadmin/companies/:id"
//                         element={<CompanyDetails />}
//                     />
//                 </Route>


//                 {/* ================= PROFILE ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="profile"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<Profile />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= EMPLOYEE ONBOARDING ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="employee/onboarding"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<EmployeeOnboarding />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= MY VISITS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="employee/visits"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<MyVisits />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= PROFILE REVIEWS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="employee/profiles"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<ProfileReviews />}
//                         />

//                         <Route
//                         path=":id"
//                         element={<ProfileReviewDetails />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= NOTIFICATIONS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="notifications"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<Notifications />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= TASKS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="tasks"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<Tasks />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= PROJECTS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="projects"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<Projects />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= ORDERS ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="orders"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<Orders />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= DAILY ACTIVITY ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "company_owner",
//                                 "hr_manager",
//                                 "hr",
//                                 "manager",
//                                 "project_manager",
//                                 "employee",
//                                 "mr"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="employee/activity"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             index
//                             element={<DailyActivity />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= ADMIN AREA ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "admin",
//                                 "super_admin",
//                                 "company_owner",
//                                 "manager",
//                                 "project_manager"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="/admin"
//                         element={<AdminLayout />}
//                     >

//                         <Route
//                             index
//                             element={<AdminDashboard />}
//                         />

//                         <Route
//                             path="doctors"
//                             element={<Doctors />}
//                         />

//                         <Route
//                             path="doctors/add"
//                             element={<AddDoctor />}
//                         />

//                         <Route
//                             path="medicals"
//                             element={<Medicals />}
//                         />

//                         <Route
//                             path="medicals/add"
//                             element={<AddMedical />}
//                         />

//                         <Route
//                             path="visits"
//                             element={<Visits />}
//                         />


//                         <Route
//                             path="users/add"
//                             element={<AddEmployee />}
//                         />

//                         <Route
//                             path="users/:id"
//                             element={<UserDetails />}
//                         />

//                         <Route
//                             element={<ProtectedRoute />}
//                         >
//                             <Route
//                                 path="profile"
//                                 element={<Profile />}
//                             />

//                             <Route
//                                 path="profile/edit"
//                                 element={<EditProfile />}
//                             />
//                         </Route>

//                     </Route>
//                 </Route>


//                 {/* ================= MR AREA ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "employee",
//                                 "mr",
//                                 "manager",
//                                 "project_manager"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="/mr"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             path="add-visit"
//                             element={<AddVisit />}
//                         />
//                     </Route>
//                 </Route>


//                 {/* ================= HR AREA ================= */}

//                 <Route
//                     element={
//                         <ProtectedRoute
//                             rolesAllowed={[
//                                 "hr",
//                                 "hr_manager",
//                                 "admin",
//                                 "company_owner",
//                                 "manager",
//                                 "project_manager"
//                             ]}
//                         />
//                     }
//                 >
//                     <Route
//                         path="/hr"
//                         element={<AdminLayout />}
//                     >
//                         <Route
//                             path="leaves"
//                             element={<Leaves />}
//                         />
//                     </Route>
//                 </Route>

//             </Route>

//         </Routes>
//     );
// };

// export default AppRoutes;


import { Routes, Route } from "react-router-dom";

import MainLayout from "../layout/MainLayout";

import Login from "../components/Login";
import Signup from "../components/SignUp";
import SuperAdminLogin from "../pages/superadmin/SuperAdminLogin";

import SuperAdminDashboard from "../pages/superadmin/SuperAdminDashboard";
import Companies from "../pages/superadmin/Companies";
import CompanyList from "../pages/superadmin/CompanyList";
import CompanyDetails from "../pages/superadmin/CompanyDetails";

import ActivateAccount from "../pages/ActivateAccount";

import Home from "../components/Home";
import About from "../components/About";
import Contact from "../components/Contact";
import Features from "../components/Features";
import PrivacyPolicy from "../components/Privacy";
import TermsAndConditions from "../components/TermsAndCondition";

import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import GuestRoute from "../components/GuestRoute";

import Doctors from "../pages/admin/Doctors";
import AddDoctor from "../pages/admin/AddDoctor";
import DoctorDetails from "../pages/admin/DoctorDetails";

import Medicals from "../pages/admin/Medicals";
import AddMedical from "../pages/admin/AddMedical";
import MedicalDetails from "../pages/admin/MedicalDetails";

import VisitRecords from "../pages/admin/VisitRecords";
import TopPerformers from "../pages/admin/TopPerformers";

import AddVisit from "../pages/mr/AddVisit";

import Leaves from "../pages/hr/Leaves";

import Users from "../pages/admin/Users";
import AddEmployee from "../pages/admin/AddEmployee";
import UserDetails from "../pages/admin/UserDetails";

import AdminDashboard from "../pages/admin/AdminDashboard";

import Profile from "../pages/profile/Profile";
import EditProfile from "../pages/profile/EditProfile";

import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

import EmployeeOnboarding from "../pages/employee/EmployeeOnboarding";
import ProfileReviews from "../pages/employee/ProfileReviews";
import ProfileReviewDetails from "../pages/employee/ProfileReviewDetails";
import MyVisits from "../pages/employee/MyVisits";

import Tasks from "../pages/tasks/Tasks";
import Orders from "../pages/orders/Orders";
import Notifications from "../pages/notifications/Notifications";
import Projects from "../pages/projects/Projects";

import DailyActivity from "../pages/employee/DailyActivity";
import SendMessage from "../pages/messages/SendMessage";
import ApplyLeave from "../pages/leaves/ApplyLeaves";
import MyLeaves from "../pages/leaves/MyLeave";
import LeaveManagement from "../pages/leaves/LeaveManagement";
import ApplyExpense from "../pages/expenses/ApplyExpense";
import ExpenseManagement from "../pages/expenses/ExpenseManagement";
import Products from "../pages/products/Products";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import ProductDetails from "../pages/products/ProductDetails";
import AuditLog from "../pages/audit/AuditLog";
import Billing from "../pages/billing/Billing";
import NotFound from "../pages/NotFound";
import Attendance from "../pages/attendance/Attendance";
import EmployeeAttendanceHistory from "../pages/attendance/EmployeeAttendanceHistory";
import Calendar from "../pages/calendar/Calendar";
import SalaryPortal from "../pages/salary/SalaryPortal";


const AppRoutes = () => {
    return (
        <Routes>

            <Route path="/" element={<MainLayout />}>

                {/* ================= PUBLIC ROUTES ================= */}

                {/* Guest-only: an authenticated user is redirected to their
                    role-specific dashboard instead of seeing these pages. */}
                <Route element={<GuestRoute />}>
                    <Route index element={<Home />} />

                    <Route path="login" element={<Login />} />

                    <Route path="signup" element={<Signup />} />
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
                    </Route>
                    <Route path="offers" element={<AdminLayout />}>
                        <Route index element={<SalaryPortal mode="offers" />} />
                        <Route path="create" element={<SalaryPortal mode="offers" />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />


            </Route>

        </Routes>
    );
};

export default AppRoutes;
