import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createDoctor } from '../../redux/slices/doctorSlice'
import { useNavigate } from 'react-router-dom'

const AddDoctor = ()=>{
  const [form, setForm] = useState({ name: '', clinicName: '', latitude: '', longitude: '', phone: '', specialty: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()
  const nav = useNavigate()

  const handleChange = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }))

  const handleGeo = ()=>{
    if(!navigator.geolocation) return alert('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(pos=>{
      setForm(f=> ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
    }, err=> alert('Unable to read location: '+err.message))
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    setLoading(true); setError(null)
    try{
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }
      await dispatch(createDoctor(payload)).unwrap()
      nav('/admin/doctors')
    }catch(err){ setError(err.message || JSON.stringify(err)) }
    setLoading(false)
  }

  return (
    <div>
      <h2>Add Doctor</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} style={{maxWidth:600}}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Clinic Name</label>
          <input name="clinicName" value={form.clinicName} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Latitude</label>
          <input name="latitude" value={form.latitude} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Longitude</label>
          <input name="longitude" value={form.longitude} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Specialty</label>
          <input name="specialty" value={form.specialty} onChange={handleChange} className="form-control" />
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={handleGeo}>Use my location</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading? 'Saving...':'Save'}</button>
        </div>
      </form>
    </div>
  )
}

export default AddDoctor
