import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createDoctor } from '../../redux/slices/doctorSlice'
import { useNavigate } from 'react-router-dom'

const AddDoctor = () => {
  const [form, setForm] = useState({
    name: '',
    clinicName: '',
    address: '',
    city: '',
    district: '',
    state: '',
    latitude: '',
    longitude: '',
    phone: '',
    specialty: '',
    dateOfBirth: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationStatus, setLocationStatus] = useState(
    'Requesting live location...'
  )

  const dispatch = useDispatch()
  const nav = useNavigate()

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value
    }))
  }

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setLocationStatus(
        'Geolocation is not supported by this browser'
      )
      return
    }

    setLocationStatus('Reading live location...')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }))

        setLocationStatus('Location updated successfully')
      },
      (err) => {
        setLocationStatus(
          `Unable to read location: ${err.message}`
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus(
        'Geolocation is not supported by this browser'
      )

      return undefined
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }))

        setLocationStatus('Live location active')
      },
      (err) => {
        setLocationStatus(
          `Location permission needed: ${err.message}`
        )
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const hasLocation =
    form.latitude !== '' &&
    form.longitude !== ''

  const mapUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        Number(form.longitude) - 0.005
      }%2C${
        Number(form.latitude) - 0.005
      }%2C${
        Number(form.longitude) + 0.005
      }%2C${
        Number(form.latitude) + 0.005
      }&layer=mapnik&marker=${
        form.latitude
      }%2C${form.longitude}`
    : ''

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      }

      await dispatch(createDoctor(payload)).unwrap()

      // Correct route based on your AppRoutes
      nav('/doctors')
    } catch (err) {
      setError(
        err?.message ||
        JSON.stringify(err) ||
        'Unable to create doctor'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4">

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

        <div>
          <div className="d-flex align-items-center gap-3 mb-2">

            <div
              className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '52px',
                height: '52px'
              }}
            >
              <i className="bi bi-person-plus-fill fs-4"></i>
            </div>

            <div>
              <h2 className="fw-bold mb-0">
                Add Doctor
              </h2>

              <p className="text-muted mb-0">
                Add a doctor and clinic information
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary rounded-3 px-4"
          onClick={() => nav('/doctors')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Doctors
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-start mb-4">

          <i className="bi bi-exclamation-triangle-fill me-3 fs-5"></i>

          <div>
            <div className="fw-semibold">
              Unable to add doctor
            </div>

            <div className="small mt-1">
              {error}
            </div>
          </div>

        </div>
      )}

      <div className="row g-4">

        {/* Doctor Form */}
        <div className="col-lg-7">

          <div className="card border-0 shadow-sm rounded-4">

            <div className="card-header bg-white border-0 p-4 pb-2">

              <h5 className="fw-bold mb-1">
                Doctor Information
              </h5>

              <p className="text-muted small mb-0">
                Enter the doctor's basic and clinic details.
              </p>

            </div>

            <div className="card-body p-4">

              <form onSubmit={handleSubmit}>

                {/* Doctor Name */}
                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Doctor Name
                  </label>

                  <div className="input-group">

                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person text-primary"></i>
                    </span>

                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-control border-start-0"
                      placeholder="Enter doctor name"
                      required
                    />

                  </div>

                </div>

                {/* Clinic */}
                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Clinic Name
                  </label>

                  <div className="input-group">

                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-building text-primary"></i>
                    </span>

                    <input
                      name="clinicName"
                      value={form.clinicName}
                      onChange={handleChange}
                      className="form-control border-start-0"
                      placeholder="Enter clinic name"
                      required
                    />

                  </div>

                </div>

                {/* Address */}
                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Address
                  </label>

                  <div className="input-group">

                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-signpost-2 text-primary"></i>
                    </span>

                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-control border-start-0"
                      placeholder="Street / area address"
                    />

                  </div>

                </div>

                <div className="row g-3 mb-1">

                  {/* City */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="City"
                    />
                  </div>

                  {/* District */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">District</label>
                    <input
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="District"
                    />
                  </div>

                  {/* State */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">State</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="State"
                    />
                  </div>

                </div>

                <div className="row g-3">

                  {/* Phone */}
                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-telephone text-success"></i>
                      </span>

                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Enter phone number"
                      />

                    </div>

                  </div>

                  {/* Specialty */}
                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Specialty
                    </label>

                    <div className="input-group">

                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-heart-pulse text-danger"></i>
                      </span>

                      <input
                        name="specialty"
                        value={form.specialty}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="e.g. Cardiologist"
                      />

                    </div>

                  </div>

                </div>

                <div className="mb-4 mt-4">
                  <label className="form-label fw-semibold" htmlFor="doctor-date-of-birth">
                    Date of Birth <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-calendar3 text-primary"></i>
                    </span>
                    <input
                      id="doctor-date-of-birth"
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="form-control border-start-0"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mt-4">

                  <div className="d-flex justify-content-between align-items-center mb-3">

                    <div>
                      <label className="form-label fw-semibold mb-1">
                        Clinic Location
                      </label>

                      <div className="small text-muted">
                        GPS coordinates are required for visit verification.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-3"
                      onClick={handleGeo}
                    >
                      <i className="bi bi-crosshair me-1"></i>
                      Refresh
                    </button>

                  </div>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <label className="form-label small text-muted">
                        Latitude
                      </label>

                      <input
                        name="latitude"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Latitude"
                        required
                      />

                    </div>

                    <div className="col-md-6">

                      <label className="form-label small text-muted">
                        Longitude
                      </label>

                      <input
                        name="longitude"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Longitude"
                        required
                      />

                    </div>

                  </div>

                  {/* Location Status */}
                  <div className="mt-3">

                    <div className="d-flex align-items-center gap-2">

                      <span
                        className={`rounded-circle ${
                          hasLocation
                            ? 'bg-success'
                            : 'bg-warning'
                        }`}
                        style={{
                          width: '9px',
                          height: '9px'
                        }}
                      ></span>

                      <span className="small text-muted">
                        {locationStatus}
                      </span>

                    </div>

                  </div>

                </div>

                {/* Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-2 mt-4 pt-3 border-top">

                  <button
                    type="button"
                    className="btn btn-light border rounded-3 px-4"
                    onClick={() => nav('/doctors')}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary rounded-3 px-4 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>

                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save Doctor
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

        {/* Location Preview */}
        <div className="col-lg-5">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-header bg-white border-0 p-4">

              <div className="d-flex align-items-center gap-3">

                <div
                  className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{
                    width: '45px',
                    height: '45px'
                  }}
                >
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </div>

                <div>
                  <h5 className="fw-bold mb-1">
                    Location Preview
                  </h5>

                  <p className="text-muted small mb-0">
                    Verify the clinic location
                  </p>
                </div>

              </div>

            </div>

            <div className="card-body p-0">

              {hasLocation ? (
                <iframe
                  title="Doctor location preview"
                  src={mapUrl}
                  style={{
                    width: '100%',
                    height: '350px',
                    border: 0
                  }}
                  loading="lazy"
                />
              ) : (
                <div
                  className="d-flex flex-column align-items-center justify-content-center text-center bg-light"
                  style={{
                    height: '350px'
                  }}
                >

                  <div
                    className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '70px',
                      height: '70px'
                    }}
                  >
                    <i className="bi bi-geo-alt text-muted fs-2"></i>
                  </div>

                  <h6 className="fw-semibold">
                    Location not available
                  </h6>

                  <p className="text-muted small px-4 mb-0">
                    Allow location access or click
                    "Refresh" to detect the current clinic location.
                  </p>

                </div>
              )}

            </div>

            {hasLocation && (
              <div className="card-footer bg-white border-0 p-3">

                <div className="row text-center">

                  <div className="col-6 border-end">

                    <small className="text-muted d-block">
                      Latitude
                    </small>

                    <span className="fw-semibold small">
                      {form.latitude}
                    </span>

                  </div>

                  <div className="col-6">

                    <small className="text-muted d-block">
                      Longitude
                    </small>

                    <span className="fw-semibold small">
                      {form.longitude}
                    </span>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      <style>
        {`
          .card {
            transition: all 0.2s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .form-control,
          .input-group-text {
            min-height: 45px;
          }

          .form-control:focus {
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
          }

          .btn {
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }
        `}
      </style>

    </div>
  )
}

export default AddDoctor