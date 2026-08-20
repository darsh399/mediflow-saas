import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createUser } from '../../redux/slices/userSlice'
import { useNavigate } from 'react-router-dom'

const AddEmployee = ()=>{
  const [form, setForm] = useState({ name:'', email:'', password:'', mobile:'', role:'employee' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()
  const nav = useNavigate()

  const handleChange = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e)=>{
    e.preventDefault(); setLoading(true); setError(null)
    try{
      await dispatch(createUser(form)).unwrap()
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
        <div className="mb-3"><label className="form-label">Password</label><input name="password" type="password" value={form.password} onChange={handleChange} className="form-control" required/></div>
        <div className="mb-3"><label className="form-label">Mobile</label><input name="mobile" value={form.mobile} onChange={handleChange} className="form-control" /></div>
        <div className="mb-3"><label className="form-label">Role</label><select name="role" value={form.role} onChange={handleChange} className="form-select"><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option><option value="admin">Admin</option></select></div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading? 'Saving...':'Save'}</button>
      </form>
    </div>
  )
}

export default AddEmployee
