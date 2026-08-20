import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import userApi from '../../api/userApi'
import { useNavigate } from 'react-router-dom'

const EditProfile = ()=>{
  const auth = useSelector(s => s.auth)
  const user = auth?.user
  const [form, setForm] = useState({ fatherName:'', dob:'', gender:'', mobileAlternate:'', emergencyContactName:'', emergencyContactPhone:'', line1:'', city:'', designation:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  useEffect(()=>{
    const fetch = async ()=>{
      if(!user) return
      try{
        const id = user.id || user._id
        const data = await userApi.fetchUser(id)
        const u = data.user || data
        const p = u.profile || {}
        setForm({
          fatherName: p.fatherName || '',
          dob: p.dob ? new Date(p.dob).toISOString().slice(0,10) : '',
          gender: p.gender || '',
          mobileAlternate: p.mobileAlternate || '',
          emergencyContactName: p.emergencyContact?.name || '',
          emergencyContactPhone: p.emergencyContact?.phone || '',
          line1: p.currentAddress?.line1 || '',
          city: p.currentAddress?.city || '',
          designation: p.jobDetails?.designation || ''
        })
      }catch(err){}
    }
    fetch()
  }, [user])

  const handleChange = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e)=>{
    e.preventDefault(); setLoading(true); setError(null)
    try{
      const id = user.id || user._id
      const payload = {
        fatherName: form.fatherName,
        dob: form.dob || null,
        gender: form.gender,
        mobileAlternate: form.mobileAlternate,
        emergencyContact: { name: form.emergencyContactName, phone: form.emergencyContactPhone },
        currentAddress: { line1: form.line1, city: form.city },
        jobDetails: { designation: form.designation }
      }
      await userApi.updateProfile(id, payload)
      nav('/profile')
    }catch(err){ setError(err.message || JSON.stringify(err)) }
    setLoading(false)
  }

  if(!user) return <div className="container my-5"><div className="alert alert-warning">Not signed in</div></div>

  return (
    <div className="container my-5">
      <h2>Edit Profile</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} style={{maxWidth:700}}>
        <div className="row">
          <div className="col-md-6 mb-3"><label className="form-label">Father Name</label><input name="fatherName" value={form.fatherName} onChange={handleChange} className="form-control"/></div>
          <div className="col-md-6 mb-3"><label className="form-label">DOB</label><input name="dob" type="date" value={form.dob} onChange={handleChange} className="form-control"/></div>
        </div>
        <div className="mb-3"><label className="form-label">Gender</label><select name="gender" value={form.gender} onChange={handleChange} className="form-select"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
        <div className="mb-3"><label className="form-label">Alternate Mobile</label><input name="mobileAlternate" value={form.mobileAlternate} onChange={handleChange} className="form-control"/></div>
        <div className="row">
          <div className="col-md-6 mb-3"><label className="form-label">Emergency Contact Name</label><input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} className="form-control"/></div>
          <div className="col-md-6 mb-3"><label className="form-label">Emergency Contact Phone</label><input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} className="form-control"/></div>
        </div>
        <div className="mb-3"><label className="form-label">Address Line</label><input name="line1" value={form.line1} onChange={handleChange} className="form-control"/></div>
        <div className="mb-3"><label className="form-label">City</label><input name="city" value={form.city} onChange={handleChange} className="form-control"/></div>
        <div className="mb-3"><label className="form-label">Designation</label><input name="designation" value={form.designation} onChange={handleChange} className="form-control"/></div>
        <div className="d-flex gap-2"><button className="btn btn-primary" type="submit" disabled={loading}>{loading? 'Saving...':'Save'}</button><button type="button" className="btn btn-secondary" onClick={()=>nav('/profile')}>Cancel</button></div>
      </form>
    </div>
  )
}

export default EditProfile
