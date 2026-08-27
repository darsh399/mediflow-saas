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

  const hasLocation = form.latitude !== '' && form.longitude !== ''

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div
              className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: '52px', height: '52px' }}
            >
              <i className="bi bi-shop fs-4"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0">Add Medical / Shop</h2>
              <p className="text-muted mb-0">Register a new medical shop and its contact details</p>
            </div>
          </div>
        </div>

        <button type="button" className="btn btn-outline-secondary rounded-3 px-4" onClick={() => nav('/medicals')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Medicals
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-start mb-4">
          <i className="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
          <div>
            <div className="fw-semibold">Unable to add medical</div>
            <div className="small mt-1">{error}</div>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 p-4 pb-2">
              <h5 className="fw-bold mb-1">Medical Information</h5>
              <p className="text-muted small mb-0">Enter the shop's contact and address details.</p>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Shop Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-shop text-primary"></i>
                    </span>
                    <input name="name" value={form.name} onChange={handleChange} className="form-control border-start-0" placeholder="Enter shop name" required />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact Person</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-person text-primary"></i>
                      </span>
                      <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className="form-control border-start-0" placeholder="Contact person" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Mobile</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-telephone text-success"></i>
                      </span>
                      <input name="mobile" value={form.mobile} onChange={handleChange} className="form-control border-start-0" placeholder="Mobile number" />
                    </div>
                  </div>
                </div>

                <div className="mb-4 mt-3">
                  <label className="form-label fw-semibold">Email <span className="text-muted fw-normal">(optional)</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-envelope text-primary"></i>
                    </span>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="form-control border-start-0" placeholder="Email address" />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-building text-primary"></i>
                      </span>
                      <input name="city" value={form.city} onChange={handleChange} className="form-control border-start-0" placeholder="City" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Area</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-signpost-2 text-primary"></i>
                      </span>
                      <input name="area" value={form.area} onChange={handleChange} className="form-control border-start-0" placeholder="Area" />
                    </div>
                  </div>
                </div>

                <div className="mb-4 mt-3">
                  <label className="form-label fw-semibold">Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-geo-alt text-danger"></i>
                    </span>
                    <input name="address" value={form.address} onChange={handleChange} className="form-control border-start-0" placeholder="Street address" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <label className="form-label fw-semibold mb-1">Shop Location</label>
                      <div className="small text-muted">GPS coordinates are required for visit verification.</div>
                    </div>
                    <button type="button" className="btn btn-outline-primary btn-sm rounded-3" onClick={handleGeo}>
                      <i className="bi bi-crosshair me-1"></i>
                      Use My Location
                    </button>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-muted">Latitude</label>
                      <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} className="form-control" placeholder="Latitude" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-muted">Longitude</label>
                      <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} className="form-control" placeholder="Longitude" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`rounded-circle ${hasLocation ? 'bg-success' : 'bg-warning'}`} style={{ width: '9px', height: '9px' }}></span>
                      <span className="small text-muted">{hasLocation ? 'Location set' : 'No location set yet'}</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light border rounded-3 px-4" onClick={() => nav('/medicals')} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save Medical
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Location Preview</h5>
                  <p className="text-muted small mb-0">Verify the shop location</p>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {hasLocation ? (
                <iframe
                  title="Medical location preview"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude) - 0.005}%2C${Number(form.latitude) - 0.005}%2C${Number(form.longitude) + 0.005}%2C${Number(form.latitude) + 0.005}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
                  style={{ width: '100%', height: '350px', border: 0 }}
                  loading="lazy"
                />
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-center bg-light" style={{ height: '350px' }}>
                  <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
                    <i className="bi bi-geo-alt text-muted fs-2"></i>
                  </div>
                  <h6 className="fw-semibold">Location not available</h6>
                  <p className="text-muted small px-4 mb-0">Click "Use My Location" or enter coordinates manually.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .card { transition: all 0.2s ease; }
          .card:hover { transform: translateY(-2px); }
          .form-control, .input-group-text { min-height: 45px; }
          .form-control:focus { box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1); }
          .btn { transition: all 0.2s ease; }
          .btn:hover { transform: translateY(-1px); }
        `}
      </style>
    </div>
  )
}

export default AddMedical
