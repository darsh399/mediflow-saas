import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import superAdminApi from '../../api/superAdminApi'
import { useNotify } from '../../components/NotificationProvider'
import BackButton from '../../components/BackButton'

const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-'

const CompanyDetails = ()=>{
  const { id } = useParams()
  const [data,setData] = useState(null)
  const navigate = useNavigate()
  const { notify } = useNotify()

  useEffect(()=>{(async ()=>{
    try{ const r = await superAdminApi.getCompany(id); setData(r) }catch(e){console.error(e)}
  })()},[id])

  const changeStatus = async (status) => {
    try{
      await superAdminApi.updateCompanyStatus(id, { status })
      const r = await superAdminApi.getCompany(id); setData(r)
      notify('Status updated', `Company marked ${status}`)
    }catch(e){console.error(e)}
  }

  const handleDelete = async ()=>{
    if(!confirm('Delete this company? This cannot be undone')) return
    try{ await superAdminApi.deleteCompany(id); notify('Deleted', 'Company deleted'); navigate('/superadmin/companies/list') }catch(e){ console.error(e); notify('Error', e?.response?.data?.message || e?.message || 'Delete failed') }
  }

  if(!data) return <div className="container my-4">Loading...</div>
  return (
    <div className="container my-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <BackButton />
          <div>
            <h3 className="mb-0">{data.company.companyName}</h3>
              <div className="text-muted">Owner: <strong>{data.owner?.name || '-'}</strong></div>
              <div className="text-muted">Status: <strong>{data.company.status}</strong></div>
              <div className="text-muted">Employees: <strong>{data.employeeCount ?? 0}</strong></div>
          </div>
        </div>
        <div>
          {['PENDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'].includes(data.company.status) && <>
            <button className="btn btn-sm btn-success me-2" onClick={()=>changeStatus('ACTIVE')}>Approve</button>
            <button className="btn btn-sm btn-outline-danger me-2" onClick={()=>changeStatus('REJECTED')}>Reject</button>
          </>}
          {data.company.status !== 'BLOCKED' && !['PENDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'].includes(data.company.status) && data.company.status !== 'REJECTED' ? (
            <button className="btn btn-sm btn-warning me-2" onClick={()=>changeStatus('BLOCKED')}>Block</button>
          ) : (
            !['PENDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'].includes(data.company.status) && <button className="btn btn-sm btn-success me-2" onClick={()=>changeStatus('ACTIVE')}>Activate</button>
          )}
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <h5>Owner</h5>
          {data.owner ? (
            <div className="card p-3 mb-3">
              <div><strong>Name:</strong> {data.owner.name || '-'}</div>
              <div><strong>Email:</strong> {data.owner.email || '-'}</div>
              <div><strong>Mobile:</strong> {data.owner.mobile || '-'}</div>
              <div><strong>Role:</strong> {data.owner.role}</div>
            </div>
          ) : <div className="text-muted">No owner assigned</div>}
        </div>
        <div className="col-md-6">
          <h5>Company Info</h5>
          <div className="card p-3 mb-3">
            <div><strong>Email:</strong> {data.company.companyEmail || '-'}</div>
            <div><strong>Mobile:</strong> {data.company.companyMobile || '-'}</div>
            <div><strong>Website:</strong> {data.company.companyWebsite || '-'}</div>
            <div><strong>Address:</strong> {data.company.companyAddress || '-'}</div>
          </div>
        </div>
      </div>

      <h5>Subscriptions</h5>
      <div>
        { (data.subscriptions || []).map(s => (
          <div key={s._id} className="card p-2 mb-2">
            <div><strong>Plan:</strong> {s.plan}</div>
            <div><strong>Status:</strong> {s.status}</div>
            <div><strong>Start:</strong> {fmtDate(s.startDate)}</div>
            <div><strong>End:</strong> {fmtDate(s.endDate)}</div>
            <div><strong>Created:</strong> {fmtDate(s.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default CompanyDetails
