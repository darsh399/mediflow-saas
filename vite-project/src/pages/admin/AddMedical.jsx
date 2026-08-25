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
      nav('/medicals')
    }catch(err){ setError(err.message || JSON.stringify(err)) }
    setLoading(false)
  }

  return (
    <div className="container-fluid py-4">

      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
          style={{ width: '52px', height: '52px' }}
        >
          <i className="bi bi-shop fs-4"></i>
        </div>
        <div>
          <h2 className="fw-bold mb-0">Add Medical / Shop</h2>
          <p className="text-muted mb-0">Register a new medical shop and its contact details.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 p-4 pb-2">
              <h5 className="fw-bold mb-1">Medical Shop Information</h5>
              <p className="text-muted small mb-0">Enter the shop's basic and contact details.</p>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name</label>
                    <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact Person</label>
                    <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Mobile</label>
                    <input name="mobile" value={form.mobile} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Address</label>
                    <input name="address" value={form.address} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Latitude</label>
                    <input name="latitude" value={form.latitude} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Longitude</label>
                    <input name="longitude" value={form.longitude} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="col-12 d-flex gap-2 pt-2">
                    <button type="button" className="btn btn-outline-secondary rounded-3" onClick={handleGeo}>
                      <i className="bi bi-geo-alt me-2"></i>
                      Use my location
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-2"></i>
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{ width: '45px', height: '45px' }}
                >
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Location</h6>
                  <p className="text-muted small mb-0">Used for visit verification.</p>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              {form.latitude && form.longitude ? (
                <div className="small text-muted">
                  <div className="mb-1"><strong>Latitude:</strong> {form.latitude}</div>
                  <div><strong>Longitude:</strong> {form.longitude}</div>
                </div>
              ) : (
                <p className="text-muted small mb-0">No coordinates set yet. Enter them manually or use "Use my location".</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AddMedical
