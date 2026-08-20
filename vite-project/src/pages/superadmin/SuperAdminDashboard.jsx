import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import { useDispatch } from 'react-redux'
import axios from '../../api/axiosInstance'
import superAdminApi from '../../api/superAdminApi'
import { clearAuth } from '../../redux/slices/authSlice'

// Charts
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const SuperAdminDashboard = ()=>{
  const [data,setData] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(()=>{(async ()=>{
    try{ const d = await superAdminApi.dashboard(); setData(d) }catch(e){console.error(e)}
  })()},[])

  if(!data) return <div className="container my-4">Loading...</div>
  return (
    <div className="container my-4">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <BackButton />
          <h3 className="mb-0">Super Admin Dashboard</h3>
        </div>
        <div>
          <Link to="/superadmin/companies" className="btn btn-sm btn-outline-primary me-2">Create Company</Link>
          <Link to="/superadmin/companies/list" className="btn btn-sm btn-outline-secondary me-2">View Companies</Link>
          <button className="btn btn-sm btn-danger" onClick={async ()=>{ try{ await axios.post('/api/superadmin/logout'); dispatch(clearAuth()); navigate('/superadmin/login') }catch(e){ console.error(e); dispatch(clearAuth()); navigate('/superadmin/login') } }}>Logout</button>
        </div>
      </div>
      <div className="row g-3 mt-3">
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Total Companies</h6><h4>{data.totalCompanies}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Active Companies</h6><h4>{data.activeCompanies}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Suspended Companies</h6><h4>{data.suspendedCompanies}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Blocked Companies</h6><h4>{data.blockedCompanies}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Pending Companies</h6><h4>{data.pendingCompanies}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Expired Subscriptions</h6><h4>{data.expiredSubs}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Active Subscriptions</h6><h4>{data.activeSubs}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Total Users</h6><h4>{data.totalUsers}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>Employees</h6><h4>{data.totalEmployees}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>HR</h6><h4>{data.totalHR}</h4></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h6>MRs</h6><h4>{data.totalMR}</h4></div></div>
      </div>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card p-3">
            <h6>Companies by Status</h6>
            <Bar data={{
              labels: ['Active','Suspended','Blocked'],
              datasets: [{ label: 'Companies', data: [data.activeCompanies, data.suspendedCompanies, data.blockedCompanies], backgroundColor: ['#4caf50','#ff9800','#f44336'] }]
            }} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h6>Subscriptions</h6>
            <Doughnut data={{ labels: ['Active','Expired'], datasets: [{ data: [data.activeSubs, data.expiredSubs], backgroundColor: ['#2196f3','#9c27b0'] }] }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
