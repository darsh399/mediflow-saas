import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDoctors, deleteDoctor } from '../../redux/slices/doctorSlice'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'

function formatDateOfBirth(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

const Doctors = () => {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.doctors)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    dispatch(fetchDoctors())
  }, [dispatch, refreshKey])

  const handleDelete = (id) => {
    if (!confirm('Delete this doctor?')) return
    dispatch(deleteDoctor(id)).then(() => setRefreshKey(k => k + 1))
  }

  const filteredDoctors = items.filter(d =>
    d.name?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white"
              style={{
                width: '46px',
                height: '46px'
              }}
            >
              <i className="bi bi-person-badge fs-4"></i>
            </div>

            <h2 className="fw-bold mb-0">Doctors</h2>
          </div>

          <p className="text-muted mb-0 ms-md-5">
            Manage doctors and their clinic information.
          </p>
        </div>

        <Link
          className="btn btn-primary px-4 py-2 rounded-3 fw-semibold"
          to="/doctors/add"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Doctor
        </Link>
      </div>

      <div className="row g-3 mb-4">

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">
                    Total Doctors
                  </p>

                  <h3 className="fw-bold mb-0">
                    {items.length}
                  </h3>
                </div>

                <div
                  className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                  style={{
                    width: '45px',
                    height: '45px'
                  }}
                >
                  <i className="bi bi-people fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">
                    Showing
                  </p>

                  <h3 className="fw-bold mb-0">
                    {filteredDoctors.length}
                  </h3>
                </div>

                <div
                  className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{
                    width: '45px',
                    height: '45px'
                  }}
                >
                  <i className="bi bi-search fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="card border-0 shadow-sm rounded-4">

        <div className="card-body p-4">

          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

            <div>
              <h5 className="fw-bold mb-1">
                Doctor Directory
              </h5>

              <p className="text-muted small mb-0">
                Search and manage registered doctors.
              </p>
            </div>

            <div className="search-bar-wrap">
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search doctors by name"
              />
            </div>

          </div>

          {loading && (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <div className="text-muted">
                Loading doctors...
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger border-0 rounded-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>

              <div>
                {error.message || JSON.stringify(error)}
              </div>
            </div>
          )}

          {!loading && !error && filteredDoctors.length === 0 && (
            <div className="text-center py-5">

              <div
                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '75px',
                  height: '75px'
                }}
              >
                <i className="bi bi-person-x fs-2 text-muted"></i>
              </div>

              <h5 className="fw-bold">
                No doctors found
              </h5>

              <p className="text-muted mb-3">
                {q
                  ? 'Try searching with a different doctor name.'
                  : 'No doctors have been added yet.'}
              </p>

              {!q && (
                <Link
                  to="/admin/doctors/add"
                  className="btn btn-primary rounded-3"
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Your First Doctor
                </Link>
              )}

            </div>
          )}

          {!loading && filteredDoctors.length > 0 && (
            <div className="table-responsive">

              <table className="table align-middle mb-0 doctors-table">

                <thead>
                  <tr className="border-bottom">

                    <th className="py-3 text-muted small text-uppercase">
                      Doctor
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Clinic
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Specialty
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Phone
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Date of Birth
                    </th>

                    <th className="py-3 text-muted small text-uppercase text-end">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id}>

                      <td className="py-3">

                        <div className="d-flex align-items-center gap-3">

                          <div
                            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: '44px',
                              height: '44px',
                              minWidth: '44px'
                            }}
                          >
                            {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {doctor.name}
                            </div>

                            <small className="text-muted">
                              Doctor
                            </small>
                          </div>

                        </div>

                      </td>

                      <td className="py-3">

                        <div className="d-flex align-items-center gap-2">

                          <i className="bi bi-building text-primary"></i>

                          <span>
                            {doctor.clinicName || 'N/A'}
                          </span>

                        </div>

                      </td>

                      <td className="py-3">

                        {doctor.specialty ? (
                          <span className="badge bg-info bg-opacity-10 text-info-emphasis rounded-pill px-3 py-2">
                            {doctor.specialty}
                          </span>
                        ) : (
                          <span className="text-muted">
                            N/A
                          </span>
                        )}

                      </td>

                      <td className="py-3">

                        {doctor.phone ? (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-telephone text-success"></i>
                            <span>{doctor.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted">
                            N/A
                          </span>
                        )}

                      </td>

                      <td className="py-3">
                        {formatDateOfBirth(doctor.dateOfBirth)}
                      </td>

                      <td className="py-3 text-end">

                        <div className="d-flex justify-content-end gap-2">

                          <Link
                            to={`${doctor._id}`}
                            className="btn btn-sm btn-outline-primary rounded-3 px-3"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Link>

                          <button
                            className="btn btn-sm btn-outline-danger rounded-3 px-3"
                            onClick={() => handleDelete(doctor._id)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      <style>
        {`
          .card {
            transition: all 0.25s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .table tbody tr {
            transition: background-color 0.2s ease;
          }

          .table tbody tr:hover {
            background-color: rgba(13, 110, 253, 0.035);
          }

          .btn {
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            /* Needs to out-specificity styles/ui-system.css's
               .table-responsive > .table min-width rule (0,2,0),
               otherwise this override is silently ignored. */
            .table-responsive > .table.doctors-table {
              min-width: 850px;
            }
          }
        `}
      </style>

    </div>
  )
}

export default Doctors