import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageContainer, PageHeader, SkeletonTable } from '../../components/ui'
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

  if(!data) return (
    <PageContainer>
      <PageHeader eyebrow="Super admin" title="Super Admin Dashboard" />
      <SkeletonTable rows={4} columns={3} />
    </PageContainer>
  )
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Super admin"
        title="Super Admin Dashboard"
        actions={
          <>
            <Link to="/superadmin/companies" className="btn btn-sm btn-outline-primary rounded-3"><i className="bi bi-building-add me-1"></i> Create Company</Link>
            <Link to="/superadmin/companies/list" className="btn btn-sm btn-ghost rounded-3"><i className="bi bi-list-ul me-1"></i> View Companies</Link>
            <Link to="/superadmin/demo-requests" className="btn btn-sm btn-ghost rounded-3"><i className="bi bi-megaphone me-1"></i> Demo Requests{data.newDemoRequests > 0 ? ` (${data.newDemoRequests})` : ''}</Link>
            <button className="btn btn-sm btn-danger rounded-3" onClick={async ()=>{ try{ await axios.post('/api/superadmin/logout'); dispatch(clearAuth()); navigate('/superadmin/login') }catch(e){ console.error(e); dispatch(clearAuth()); navigate('/superadmin/login') } }}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </>
        }
      />
      <div className="row g-3">
        {[
          { label: 'Total Companies', value: data.totalCompanies, color: 'var(--mf-color-primary)', icon: 'bi-building' },
          { label: 'Active Companies', value: data.activeCompanies, color: '#198754', icon: 'bi-check-circle' },
          { label: 'Suspended Companies', value: data.suspendedCompanies, color: '#fd7e14', icon: 'bi-pause-circle' },
          { label: 'Blocked Companies', value: data.blockedCompanies, color: '#dc3545', icon: 'bi-slash-circle' },
          { label: 'Pending Companies', value: data.pendingCompanies, color: '#ffc107', icon: 'bi-hourglass-split' },
          { label: 'Expired Subscriptions', value: data.expiredSubs, color: '#dc3545', icon: 'bi-calendar-x' },
          { label: 'Active Subscriptions', value: data.activeSubs, color: '#198754', icon: 'bi-credit-card' },
          { label: 'Trial Companies', value: data.trialSubs ?? 0, color: '#0dcaf0', icon: 'bi-stopwatch' },
          { label: 'New This Month', value: data.newCompaniesThisMonth ?? 0, color: 'var(--mf-color-accent)', icon: 'bi-graph-up-arrow' },
          { label: 'New Demo Requests', value: data.newDemoRequests ?? 0, color: '#d63384', icon: 'bi-megaphone' },
          { label: 'Monthly Revenue', value: Number(data.monthlyRevenue ?? 0).toLocaleString(), color: '#20c997', icon: 'bi-currency-rupee' },
          { label: 'Total Users', value: data.totalUsers, color: 'var(--mf-color-primary)', icon: 'bi-people' },
          { label: 'Employees', value: data.totalEmployees, color: 'var(--mf-color-accent)', icon: 'bi-person-badge' },
          { label: 'HR', value: data.totalHR, color: '#d63384', icon: 'bi-person-workspace' },
          { label: 'MRs', value: data.totalMR, color: '#fd7e14', icon: 'bi-briefcase' },
        ].map((stat) => (
          <div className="col-sm-6 col-md-4" key={stat.label}>
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: `4px solid ${stat.color}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">{stat.label}</h6>
                  <h4 className="fw-bold mb-0">{stat.value}</h4>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '42px', height: '42px', backgroundColor: `${stat.color}1a`, color: stat.color }}
                >
                  <i className={`bi ${stat.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold">Companies by Status</h6>
            <Bar data={{
              labels: ['Active','Pending','Suspended','Blocked','Rejected'],
              datasets: [{ label: 'Companies', data: [data.activeCompanies, data.pendingCompanies, data.suspendedCompanies, data.blockedCompanies, data.rejectedCompanies ?? 0], backgroundColor: ['#4caf50','#ffc107','#ff9800','#f44336','#6c757d'] }]
            }} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold">Subscriptions</h6>
            <Doughnut data={{ labels: ['Active','Expired'], datasets: [{ data: [data.activeSubs, data.expiredSubs], backgroundColor: ['#2196f3','#9c27b0'] }] }} />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default SuperAdminDashboard
