import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'

const AddEmployee = ()=>{
  const [form, setForm] = useState({ name:'', email:'', mobile:'', role:'employee' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const handleChange = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e)=>{
    e.preventDefault(); setLoading(true); setError(null)
    try{
      await authApi.sendInviteApi({ inviteeEmail: form.email, role: form.role, profileTemplate: { name: form.name, mobile: form.mobile } })
      nav('/admin/users')
    }catch(err){ setError(err.message || JSON.stringify(err)) }
    setLoading(false)
  }

  return (
    <div>
      <h2>Add Employee</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} style={{maxWidth:600}}>
        <div className="mb-3"><label className="form-label">Name</label><input name="name" value={form.name} onChange={handleChange} className="form-control" required/></div>
        <div className="mb-3"><label className="form-label">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className="form-control" required/></div>
        <div className="mb-3"><label className="form-label">Mobile</label><input name="mobile" value={form.mobile} onChange={handleChange} className="form-control" /></div>
        <div className="mb-3"><label className="form-label">Role</label><select name="role" value={form.role} onChange={handleChange} className="form-select"><option value="employee">Employee</option><option value="mr">MR</option><option value="project_manager">Project Manager</option><option value="hr">HR</option><option value="hr_manager">HR Manager</option></select></div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading? 'Saving...':'Save'}</button>
      </form>
    </div>
  )
}

export default AddEmployee
