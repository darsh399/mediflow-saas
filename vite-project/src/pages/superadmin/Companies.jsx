import { useState } from 'react'
import { useNotify } from '../../components/NotificationProvider'
import BackButton from '../../components/BackButton'
import superAdminApi from '../../api/superAdminApi'

const Companies = ()=>{
  const [companyName,setCompanyName] = useState('')
  const [companyEmail,setCompanyEmail] = useState('')
  const [companyMobile,setCompanyMobile] = useState('')
  const [ownerName,setOwnerName] = useState('')
  const [ownerEmail,setOwnerEmail] = useState('')
  const [ownerMobile,setOwnerMobile] = useState('')
  const [role,setRole] = useState('company_owner')
  const [plan,setPlan] = useState('1_YEAR')
  const { notify } = useNotify();

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const payload = { companyName, companyEmail, companyMobile, ownerName, ownerEmail, ownerMobile, role, plan }
      const resp = await superAdminApi.createCompany(payload)
      notify('Company created', 'Created: ' + (resp.company?.companyName || 'OK'))
      setCompanyName(''); setCompanyEmail(''); setCompanyMobile(''); setOwnerName(''); setOwnerEmail(''); setOwnerMobile(''); setRole('company_owner'); setPlan('1_YEAR')
    }catch(err){ console.error(err); notify(err?.response?.data?.message || err?.message) }
  }

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center mb-3">
        <BackButton />
        <h3 className="mb-0">Companies</h3>
      </div>
      <form onSubmit={submit} style={{maxWidth:720}}>
        <div className="mb-3"><label className="form-label">Company Name (optional)</label><input className="form-control" value={companyName} onChange={e=>setCompanyName(e.target.value)} /></div>
        <div className="mb-3"><label className="form-label">Company Email</label><input className="form-control" value={companyEmail} onChange={e=>setCompanyEmail(e.target.value)} /></div>
        <div className="mb-3"><label className="form-label">Company Mobile</label><input className="form-control" value={companyMobile} onChange={e=>setCompanyMobile(e.target.value)} /></div>
        <div className="mb-3"><label className="form-label">Owner Name</label><input className="form-control" value={ownerName} onChange={e=>setOwnerName(e.target.value)} required/></div>
        <div className="mb-3"><label className="form-label">Owner Email</label><input className="form-control" value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} required/></div>
        <div className="mb-3"><label className="form-label">Owner Mobile</label><input className="form-control" value={ownerMobile} onChange={e=>setOwnerMobile(e.target.value)} required /></div>
        <div className="mb-3"><label className="form-label">Initial Role</label><select className="form-select" value={role} onChange={e=>setRole(e.target.value)}><option value="company_owner">Company Owner</option><option value="hr_manager">HR Manager</option><option value="hr">HR</option><option value="project_manager">Project Manager</option><option value="employee">Employee</option></select></div>
        <div className="mb-3"><label className="form-label">Plan</label>
          <select className="form-select" value={plan} onChange={e=>setPlan(e.target.value)}>
            <option value="3_YEAR">3 Years</option>
            <option value="2_YEAR">2 Years</option>
            <option value="1_YEAR">1 Year</option>
            <option value="6_MONTHS">6 Months</option>
            <option value="3_MONTHS">3 Months</option>
            <option value="1_MONTH">1 Month</option>
          </select>
        </div>
        <button className="btn btn-primary">Create Company & Invite Owner</button>
      </form>
    </div>
  )
}

export default Companies
