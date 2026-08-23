import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import employeeProfileApi from '../../api/employeeProfileApi'

const ProfileReviews = () => {
  const navigate = useNavigate()

  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await employeeProfileApi.listProfiles()

      setProfiles(response.profiles || [])
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to load employee profiles'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const review = async (id, status) => {
    let rejectionReason

    if (status === 'REJECTED') {
      rejectionReason = window.prompt(
        'Please enter the reason for rejecting this profile:'
      )

      if (!rejectionReason?.trim()) return
    }

    try {
      setReviewingId(id)
      setError('')

      await employeeProfileApi.reviewProfile(id, {
        status,
        rejectionReason
      })

      await load()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to review profile'
      )
    } finally {
      setReviewingId(null)
    }
  }

  const getInitials = name => {
    if (!name) return 'U'

    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getStatusBadge = status => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="badge bg-success-subtle text-success px-3 py-2">
            Approved
          </span>
        )

      case 'REJECTED':
        return (
          <span className="badge bg-danger-subtle text-danger px-3 py-2">
            Rejected
          </span>
        )

      case 'SUBMITTED':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-2">
            Pending Review
          </span>
        )

      default:
        return (
          <span className="badge bg-secondary-subtle text-secondary px-3 py-2">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  const filteredProfiles = profiles.filter(profile => {
    const name = profile.userId?.name?.toLowerCase() || ''
    const email = profile.userId?.email?.toLowerCase() || ''
    const role = profile.userId?.role?.toLowerCase() || ''
    const mobile = profile.userId?.mobile?.toLowerCase() || ''
    const phone = profile.userId?.phone?.toLowerCase() || ''

    const searchValue = search.toLowerCase().trim()

    return (
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      role.includes(searchValue) ||
      mobile.includes(searchValue) ||
      phone.includes(searchValue)
    )
  })

  const submittedCount = profiles.filter(
    profile => profile.status === 'SUBMITTED'
  ).length

  const approvedCount = profiles.filter(
    profile => profile.status === 'APPROVED'
  ).length

  const rejectedCount = profiles.filter(
    profile => profile.status === 'REJECTED'
  ).length

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            />

            <h6 className="text-muted mb-0">
              Loading employee profiles...
            </h6>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <span className="text-primary fw-semibold small">
            EMPLOYEE MANAGEMENT
          </span>

          <h2 className="fw-bold mb-1 mt-1">
            Profile Reviews
          </h2>

          <p className="text-muted mb-0">
            Review employee profiles and submitted documents.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={load}
        >
          ↻ Refresh
        </button>

      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted small mb-2">
                Total Profiles
              </p>

              <h3 className="fw-bold mb-0">
                {profiles.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted small mb-2">
                Pending Review
              </p>

              <h3 className="fw-bold mb-0 text-warning">
                {submittedCount}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted small mb-2">
                Approved
              </p>

              <h3 className="fw-bold mb-0 text-success">
                {approvedCount}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted small mb-2">
                Rejected
              </p>

              <h3 className="fw-bold mb-0 text-danger">
                {rejectedCount}
              </h3>
            </div>
          </div>
        </div>

      </div>

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 p-4">

          <div className="row align-items-center g-3">

            <div className="col-lg-5">
              <h5 className="fw-bold mb-1">
                Employee Profiles
              </h5>

              <p className="text-muted small mb-0">
                Click an employee to view complete details.
              </p>
            </div>

            <div className="col-lg-7">

              <div className="input-group">

                <span className="input-group-text bg-white">
                  🔍
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, mobile or role..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />

                {search && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearch('')}
                  >
                    Clear
                  </button>
                )}

              </div>

            </div>

          </div>

          <div className="mt-3">
            <span className="text-muted small">
              Showing{' '}
              <strong>{filteredProfiles.length}</strong>{' '}
              of{' '}
              <strong>{profiles.length}</strong>{' '}
              employees
            </span>
          </div>

        </div>

        <div className="table-responsive">

          <table className="table align-middle mb-0">

            <thead className="table-light">

              <tr>
                <th className="px-4 py-3">
                  Employee
                </th>

                <th className="py-3">
                  Role
                </th>

                <th className="py-3">
                  Mobile
                </th>

                <th className="py-3">
                  Status
                </th>

                <th className="py-3 text-end pe-4">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody>

              {filteredProfiles.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5"
                  >
                    <div
                      className="mb-2"
                      style={{ fontSize: '32px' }}
                    >
                      🔍
                    </div>

                    <h6 className="fw-bold">
                      No employees found
                    </h6>

                    <p className="text-muted small mb-0">
                      Try another search.
                    </p>
                  </td>
                </tr>

              ) : (

                filteredProfiles.map(profile => {

                  const employee = profile.userId

                  return (
                    <tr key={profile._id}>

                      <td className="px-4">

                        <button
                          type="button"
                          className="btn btn-link text-decoration-none p-0"
                          onClick={() =>
                            navigate(
                              `/admin/profile-${profile._id}`
                            )
                          }
                        >

                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{
                                width: '44px',
                                height: '44px'
                              }}
                            >
                              {getInitials(employee?.name)}
                            </div>

                            <div className="text-start">

                              <div className="fw-semibold text-dark">
                                {employee?.name || 'Unknown Employee'}
                              </div>

                              <div className="small text-muted">
                                {employee?.email || 'No email'}
                              </div>

                            </div>

                          </div>

                        </button>

                      </td>

                      <td>
                        <span className="text-capitalize">
                          {employee?.role || 'N/A'}
                        </span>
                      </td>

                      <td>
                        {employee?.mobile ||
                          employee?.phone ||
                          'N/A'}
                      </td>

                      <td>
                        {getStatusBadge(profile.status)}
                      </td>

                      <td className="text-end pe-4">

                        {profile.status === 'SUBMITTED' ? (

                          <div className="d-flex justify-content-end gap-2">

                            <button
                              type="button"
                              className="btn btn-sm btn-success px-3"
                              disabled={
                                reviewingId === profile._id
                              }
                              onClick={() =>
                                review(
                                  profile._id,
                                  'APPROVED'
                                )
                              }
                            >
                              {reviewingId === profile._id
                                ? 'Processing...'
                                : 'Approve'}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger px-3"
                              disabled={
                                reviewingId === profile._id
                              }
                              onClick={() =>
                                review(
                                  profile._id,
                                  'REJECTED'
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : (

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              navigate(
                                `${profile._id}`
                              )
                            }
                          >
                            View Profile
                          </button>

                        )}

                      </td>

                    </tr>
                  )
                })
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default ProfileReviews