import { useEffect, useState } from 'react'
import axios from '../../api/axiosInstance'
import { Link } from 'react-router-dom'
import BackButton from '../../components/BackButton'

const STATUS_STYLES = {
  ACTIVE: { backgroundColor: '#e8f8ef', color: '#198754' },
  BLOCKED: { backgroundColor: '#fdecec', color: '#dc3545' },
  REJECTED: { backgroundColor: '#fdecec', color: '#dc3545' },
  SUSPENDED: { backgroundColor: '#fff4e5', color: '#fd7e14' },
  PENDING: { backgroundColor: '#fff9e0', color: '#997404' },
  PENDING_APPROVAL: { backgroundColor: '#fff9e0', color: '#997404' },
  PENDING_ACTIVATION: { backgroundColor: '#fff9e0', color: '#997404' },
}
const statusStyle = status => STATUS_STYLES[status] || { backgroundColor: '#f1f3f5', color: '#6c757d' }

const CompanyList = ()=>{
  const [list,setList] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{(async ()=>{
    try{ const r = await axios.get('/api/superadmin/companies'); setList(r.data.companies || []) }catch(e){console.error(e)} finally { setLoading(false) }
  })()},[])

  return (
    <div className="container-fluid py-4">
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-body p-4 p-lg-5 text-white" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)' }}>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
            <BackButton />
            <span className="opacity-75 small">SUPER ADMIN</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '55px', height: '55px' }}>
              <i className="bi bi-buildings fs-3"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0">Companies</h2>
              <p className="mb-0 opacity-75">All companies registered on MediFlow.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fc' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Name</th>
                  <th className="py-3 border-0">Status</th>
                  <th className="py-3 border-0">Subscription</th>
                  <th className="py-3 border-0 pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? list.map(c=> (
                  <tr key={c._id}>
                    <td className="px-4 py-3 fw-semibold">{c.companyName}</td>
                    <td className="py-3">
                      <span className="badge rounded-pill px-3 py-2" style={statusStyle(c.status)}>{c.status || '-'}</span>
                    </td>
                    <td className="py-3">
                      {c.subscription ? (
                        <span className="badge rounded-pill px-3 py-2" style={statusStyle(c.subscription.status)}>{c.subscription.status}</span>
                      ) : <span className="text-muted small">N/A</span>}
                    </td>
                    <td className="py-3 pe-4"><Link to={`/superadmin/companies/${c._id}`} className="btn btn-sm btn-outline-primary rounded-3">Details</Link></td>
                  </tr>
                )) : <tr><td colSpan="4" className="text-center text-muted py-5">No companies found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
export default CompanyList
