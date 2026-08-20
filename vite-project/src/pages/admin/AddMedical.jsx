import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createMedical } from '../../redux/slices/medicalSlice'
import { useNavigate } from 'react-router-dom'

const AddMedical = ()=>{
  const [form, setForm] = useState({ name: '', contactPerson: '', mobile: '', email: '', address: '', city: '', area: '', latitude: '', longitude: '' })
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
      await dispatch(createMedical(payload)).unwrap()
      nav('/admin/medicals')
    }catch(err){ setError(err.message || JSON.stringify(err)) }
    setLoading(false)
  }

  return (
    <div>
      <h2>Add Medical / Shop</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} style={{maxWidth:600}}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Contact Person</label>
          <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Mobile</label>
          <input name="mobile" value={form.mobile} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">City</label>
          <input name="city" value={form.city} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Latitude</label>
          <input name="latitude" value={form.latitude} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Longitude</label>
          <input name="longitude" value={form.longitude} onChange={handleChange} className="form-control" />
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={handleGeo}>Use my location</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading? 'Saving...':'Save'}</button>
        </div>
      </form>
    </div>
  )
}

export default AddMedical
