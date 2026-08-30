import { useState } from 'react'
import { useSelector } from 'react-redux'
import doctorApi from '../api/doctorApi'

// Roles allowed to fill in blanks on a doctor record (mirrors the backend
// `completeRoles` on /api/doctors/:id/complete). This only ever fills empty
// fields — it cannot overwrite existing data — so every company member may use
// it to add an address / GPS location for a doctor they visit.
const COMPLETE_ROLES = ['admin', 'company_owner', 'hr', 'hr_manager', 'mr', 'manager', 'project_manager', 'employee', 'user', 'superadmin', 'super_admin']

const isBlank = (value) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '')

const DoctorCompletePanel = ({ doctor, onDoctorUpdate }) => {
  const role = useSelector((s) => s.auth.user?.role)
  const canComplete = COMPLETE_ROLES.includes(role)

  const needsAddress = isBlank(doctor.address)
  const needsCity = isBlank(doctor.city)
  const needsDistrict = isBlank(doctor.district)
  const needsState = isBlank(doctor.state)
  const needsPhone = isBlank(doctor.phone)
  const needsDob = isBlank(doctor.dateOfBirth)
  const needsLocation = typeof doctor.latitude !== 'number' || typeof doctor.longitude !== 'number'

  const anythingMissing = needsAddress || needsCity || needsDistrict || needsState || needsPhone || needsDob || needsLocation

  const [form, setForm] = useState({ address: '', city: '', district: '', state: '', phone: '', dateOfBirth: '', latitude: '', longitude: '', altitude: '' })
  const [locationStatus, setLocationStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  if (!canComplete || !anythingMissing) return null

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser')
      return
    }
    setLocationStatus('Reading current location...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((current) => ({
          ...current,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          altitude: pos.coords.altitude != null ? pos.coords.altitude.toFixed(1) : current.altitude,
        }))
        setLocationStatus(
          pos.coords.altitude != null
            ? 'Location captured (with altitude)'
            : 'Location captured (this device does not report altitude)'
        )
      },
      (err) => setLocationStatus(`Unable to read location: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSave = async () => {
    const payload = {}
    if (needsAddress && form.address.trim()) payload.address = form.address.trim()
    if (needsCity && form.city.trim()) payload.city = form.city.trim()
    if (needsDistrict && form.district.trim()) payload.district = form.district.trim()
    if (needsState && form.state.trim()) payload.state = form.state.trim()
    if (needsPhone && form.phone.trim()) payload.phone = form.phone.trim()
    if (needsDob && form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
    if (needsLocation && form.latitude !== '' && form.longitude !== '') {
      payload.latitude = Number(form.latitude)
      payload.longitude = Number(form.longitude)
      if (form.altitude !== '') payload.altitude = Number(form.altitude)
    }

    if (Object.keys(payload).length === 0) {
      setError('Fill in at least one field first')
      return
    }

    try {
      setSaving(true)
      setError('')
      setDone('')
      const data = await doctorApi.completeDoctor(doctor._id, payload)
      onDoctorUpdate?.(data.doctor)
      setDone('Details saved.')
      setForm({ address: '', city: '', district: '', state: '', phone: '', dateOfBirth: '', latitude: '', longitude: '', altitude: '' })
      setLocationStatus('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save the details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="col-12">
      <div className="card border-0 shadow-sm rounded-4 border-start border-warning border-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-1">
            <i className="bi bi-clipboard-plus text-warning me-2"></i>
            Complete Doctor Details
          </h5>
          <p className="text-muted small mb-4">
            This record is missing: {doctor.completeness?.missing?.join(', ') || 'some details'}.
            Fill in what you can — existing information will not be changed.
          </p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {done && <div className="alert alert-success py-2 small"><i className="bi bi-check-circle-fill me-1"></i>{done}</div>}

          <div className="row g-3">
            {needsAddress && (
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Current Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Clinic address" />
              </div>
            )}
            {needsCity && (
              <div className="col-md-3">
                <label className="form-label small fw-semibold">City</label>
                <input className="form-control" value={form.city} onChange={(e) => setField('city', e.target.value)} />
              </div>
            )}
            {needsDistrict && (
              <div className="col-md-3">
                <label className="form-label small fw-semibold">District</label>
                <input className="form-control" value={form.district} onChange={(e) => setField('district', e.target.value)} />
              </div>
            )}
            {needsState && (
              <div className="col-md-3">
                <label className="form-label small fw-semibold">State</label>
                <input className="form-control" value={form.state} onChange={(e) => setField('state', e.target.value)} />
              </div>
            )}
            {needsPhone && (
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </div>
            )}
            {needsDob && (
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Date of Birth</label>
                <input type="date" className="form-control" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
              </div>
            )}
          </div>

          {needsLocation && (
            <div className="mt-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <label className="form-label fw-semibold mb-0">Clinic Location</label>
                <button type="button" className="btn btn-outline-primary btn-sm rounded-3" onClick={useCurrentLocation}>
                  <i className="bi bi-crosshair me-1"></i>Use current location
                </button>
              </div>
              {locationStatus && <div className="small text-muted mb-2">{locationStatus}</div>}
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small text-muted">Latitude</label>
                  <input type="number" step="any" className="form-control" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-muted">Longitude</label>
                  <input type="number" step="any" className="form-control" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-muted">Altitude <span className="fw-normal">(optional)</span></label>
                  <input type="number" step="any" className="form-control" value={form.altitude} onChange={(e) => setField('altitude', e.target.value)} />
                </div>
              </div>
              <div className="form-text">Coordinates let the app verify field visits against this clinic.</div>
            </div>
          )}

          <div className="mt-4">
            <button type="button" className="btn btn-primary rounded-3 px-4 fw-semibold" onClick={handleSave} disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                : <><i className="bi bi-check-lg me-2"></i>Save details</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorCompletePanel
