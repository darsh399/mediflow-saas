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
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import Doctors from "../pages/admin/Doctors";
import AddDoctor from "../pages/admin/AddDoctor";
import Medicals from "../pages/admin/Medicals";
import AddMedical from "../pages/admin/AddMedical";
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
import Tasks from "../pages/tasks/Tasks";
import Orders from "../pages/orders/Orders";
import Notifications from "../pages/notifications/Notifications";


const AppRoutes = () => {
    return(
               <Routes>
                <Route path='/' element={<MainLayout/>}>
                 <Route index element={<Home/>} />
                 <Route path='login' element={<Login/>}/>
                 <Route path='signup' element={<Signup/>}/>
                 <Route path='forgot-password' element={<ForgotPassword/>}/>
                 <Route path='reset-password' element={<ResetPassword/>}/>
                 <Route path='superadmin/login' element={<SuperAdminLogin/>} />
                 <Route element={<ProtectedRoute rolesAllowed={["super_admin"]} />}>
                  <Route path='superadmin/dashboard' element={<SuperAdminDashboard/>} />
                  <Route path='superadmin/companies' element={<Companies/>} />
                  <Route path='superadmin/companies/list' element={<CompanyList/>} />
                  <Route path='superadmin/companies/:id' element={<CompanyDetails/>} />
                 </Route>
                 <Route path='activate-account' element={<ActivateAccount/>} />
                 <Route element={<ProtectedRoute rolesAllowed={["admin","company_owner","hr_manager","hr","manager","employee","mr"]} />}>
                  <Route path='employee/onboarding' element={<AdminLayout />}><Route index element={<EmployeeOnboarding />} /></Route>
                 </Route>
                 <Route element={<ProtectedRoute rolesAllowed={["admin","company_owner","hr_manager","hr","manager"]} />}>
                  <Route path='employee/profiles' element={<AdminLayout />}><Route index element={<ProfileReviews />} /></Route>
                 </Route>
                 <Route element={<ProtectedRoute rolesAllowed={["admin","company_owner","hr_manager","hr","manager","employee","mr"]} />}>
                  <Route path='notifications' element={<AdminLayout />}><Route index element={<Notifications />} /></Route>
                 </Route>
                 <Route element={<ProtectedRoute rolesAllowed={["admin","company_owner","hr_manager","hr","manager","employee","mr"]} />}>
                  <Route path='tasks' element={<AdminLayout />}><Route index element={<Tasks />} /></Route>
                 </Route>
                 <Route element={<ProtectedRoute rolesAllowed={["admin","company_owner","hr_manager","hr","manager","employee","mr"]} />}>
                  <Route path='orders' element={<AdminLayout />}><Route index element={<Orders />} /></Route>
                 </Route>
                                 <Route path='about' element={<About/>} />
                                 <Route path='contact' element={<Contact/>} />

                                 {/* Admin area */}
                                 <Route element={<ProtectedRoute rolesAllowed={["admin","super_admin","company_owner","manager"]} /> }>
                                     <Route path="/admin" element={<AdminLayout/>}>
                                         <Route index element={<AdminDashboard/>} />
                                         <Route path="doctors" element={<Doctors/>} />
                                         <Route path="doctors/add" element={<AddDoctor/>} />
                                         <Route path="medicals" element={<Medicals/>} />
                                         <Route path="medicals/add" element={<AddMedical/>} />
                                        <Route path="visits" element={<></>} />
                                        <Route path="users" element={<Users/>} />
                                        <Route path="users/add" element={<AddEmployee/>} />
                                        <Route path="users/:id" element={<UserDetails/>} />
                                     <Route element={<ProtectedRoute /> }>
                                         <Route path="profile" element={<Profile/>} />
                                         <Route path="profile/edit" element={<EditProfile/>} />
                                     </Route>
                                    </Route>
                                 </Route>

                                {/* MR area */}
                                <Route element={<ProtectedRoute rolesAllowed={["employee","mr","manager"]} /> }>
                                    <Route path="/mr" element={<AdminLayout/>}>
                                        <Route path="add-visit" element={<AddVisit/>} />
                                    </Route>
                                </Route>

                                {/* HR area */}
                                <Route element={<ProtectedRoute rolesAllowed={["hr","hr_manager","admin"]} /> }>
                                    <Route path="/hr" element={<AdminLayout/>}>
                                        <Route path="leaves" element={<Leaves/>} />
                                    </Route>
                                </Route>
                </Route>
               </Routes>
    )
}

export default AppRoutes;


