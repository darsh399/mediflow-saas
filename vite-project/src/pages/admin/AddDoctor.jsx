import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createDoctor } from '../../redux/slices/doctorSlice'
import { useNavigate } from 'react-router-dom'

const AddDoctor = ()=>{
  const [form, setForm] = useState({ name: '', clinicName: '', latitude: '', longitude: '', phone: '', specialty: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationStatus, setLocationStatus] = useState('Requesting live location...')
  const dispatch = useDispatch()
  const nav = useNavigate()

  const handleChange = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }))

  const handleGeo = ()=>{
    if(!navigator.geolocation) return setLocationStatus('Geolocation is not supported by this browser')
    setLocationStatus('Reading live location...')
    navigator.geolocation.getCurrentPosition(pos=>{
      setForm(f=> ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }))
      setLocationStatus('Location updated')
    }, err=> setLocationStatus(`Unable to read location: ${err.message}`), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser')
      return undefined
    }
    const watchId = navigator.geolocation.watchPosition(pos => {
      setForm(f=> ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }))
      setLocationStatus('Live location active')
    }, err => setLocationStatus(`Location permission needed: ${err.message}`), { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const hasLocation = form.latitude !== '' && form.longitude !== ''
  const mapUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude) - 0.005}%2C${Number(form.latitude) - 0.005}%2C${Number(form.longitude) + 0.005}%2C${Number(form.latitude) + 0.005}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`
    : ''

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
          <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Longitude</label>
          <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Specialty</label>
          <input name="specialty" value={form.specialty} onChange={handleChange} className="form-control" />
        </div>

        <div className="mb-3">
          <div className="small text-muted mb-2">{locationStatus}</div>
          {hasLocation && <iframe title="Doctor location preview" src={mapUrl} style={{ width: '100%', height: 220, border: 0 }} loading="lazy" />}
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={handleGeo}>Refresh location</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading? 'Saving...':'Save'}</button>
        </div>
      </form>
    </div>
  )
}

export default AddDoctor
