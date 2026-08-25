import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser, changeUserStatus } from '../../redux/slices/userSlice'
import { useNavigate, useParams } from 'react-router-dom'

const UserDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { current, loading, error } = useSelector((state) => state.users)

  useEffect(() => {
    if (id) {
      dispatch(fetchUser(id))
      const refresh = window.setInterval(() => dispatch(fetchUser(id)), 30000)
      return () => window.clearInterval(refresh)
    }
  }, [dispatch, id])

  const handleStatus = (action) => {
    if (!window.confirm(`Perform ${action}?`)) return

    dispatch(changeUserStatus({ id, action }))
  }

  // Calculate days from joining date
  const calculateDaysFromJoining = (joiningDate) => {
    if (!joiningDate) return null

    const joined = new Date(joiningDate)
    const today = new Date()

    joined.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const difference = today - joined

    return Math.max(
      0,
      Math.floor(difference / (1000 * 60 * 60 * 24))
    )
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getInitials = (name) => {
    if (!name) return 'U'

    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

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
              Loading user details...
            </h6>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger shadow-sm border-0">
          <strong>Unable to load user</strong>
          <div className="mt-1">
            {error.message || JSON.stringify(error)}
          </div>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning shadow-sm border-0">
          User not found
        </div>
      </div>
    )
  }

  // Older employee accounts store this under their onboarding profile. If a
  // joining date was never entered, the account creation date is the best
  // available indication of when they joined the company.
  const joiningDate =
    current.joiningDate ||
    current.joinedAt ||
    current.profile?.jobDetails?.startDate ||
    current.profile?.startDate ||
    current.createdAt
  const daysFromJoining = calculateDaysFromJoining(joiningDate)
  const employeeId = current.employeeId || `EMP-${String(current._id || current.id || '').slice(-6).toUpperCase()}`
  const onboardingProfile = current.onboardingProfile || {}
  const displayName = onboardingProfile.fullName || current.name || 'Unknown User'
  const displayMobile = onboardingProfile.mobile || current.mobile || current.phone || 'N/A'

  const formatDuration = (hours) => {
    const totalMinutes = Math.max(0, Math.round(Number(hours || 0) * 60))
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
  }

  const isActive = current.active === true
  const isBlocked = current.blocked === true
  const attendanceSummary = current.attendanceSummary

  return (
    <div className="container-fluid py-4">

      {/* ================= HEADER ================= */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <button
              type="button"
              className="btn btn-sm btn-light border"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>

            <span className="text-muted small">
              User Management
            </span>
          </div>

          <h3 className="fw-bold mb-1">
            User Details
          </h3>

          <p className="text-muted mb-0">
            View and manage employee account information
          </p>
        </div>

        <div className="d-flex gap-2">

          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            Close
          </button>

        </div>
      </div>

      {/* ================= PROFILE HEADER ================= */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">

        <div
          className="bg-primary"
          style={{ height: '90px' }}
        />

        <div className="card-body position-relative pt-0">

          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">

            <div className="d-flex align-items-end gap-3">

              {/* Avatar */}
              <div
                className="rounded-circle bg-white shadow d-flex align-items-center justify-content-center fw-bold text-primary"
                style={{
                  width: '90px',
                  height: '90px',
                  fontSize: '28px',
                  marginTop: '-45px',
                  border: '4px solid #fff'
                }}
              >
                {getInitials(displayName)}
              </div>

              <div className="pb-2">

                <h4 className="fw-bold mb-1">
                  {displayName}
                </h4>

                <div className="text-muted">
                  {current.email || 'No email available'}
                </div>

              </div>

            </div>

            {/* Status */}
            <div className="pb-2">

              {isBlocked ? (
                <span className="badge bg-danger px-3 py-2">
                  ● Blocked
                </span>
              ) : isActive ? (
                <span className="badge bg-success px-3 py-2">
                  ● Active
                </span>
              ) : (
                <span className="badge bg-secondary px-3 py-2">
                  ● Inactive
                </span>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="row g-3 mb-4">

        {/* Role */}
        <div className="col-xl-3 col-md-6">

          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="text-muted small mb-2">
                Role
              </div>

              <h5 className="fw-bold mb-0 text-capitalize">
                {current.role || 'N/A'}
              </h5>

            </div>
          </div>

        </div>

        {/* Joining Date */}
        <div className="col-xl-3 col-md-6">

          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="text-muted small mb-2">
                Joining Date
              </div>

              <h5 className="fw-bold mb-0">
                {formatDate(joiningDate)}
              </h5>

            </div>
          </div>

        </div>

        {/* Days */}
        <div className="col-xl-3 col-md-6">

          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="text-muted small mb-2">
                Days With Company
              </div>

              <h5 className="fw-bold mb-0">
                {daysFromJoining !== null
                  ? `${daysFromJoining} days`
                  : 'N/A'}
              </h5>

            </div>
          </div>

        </div>

        {/* Account */}
        <div className="col-xl-3 col-md-6">

          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="text-muted small mb-2">
                Account Status
              </div>

              <h5 className="fw-bold mb-0">
                {isBlocked
                  ? 'Blocked'
                  : isActive
                    ? 'Active'
                    : 'Inactive'}
              </h5>

            </div>
          </div>

        </div>

      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="text-muted small mb-2">Live attendance</div>
              <h5 className="fw-bold mb-1">{attendanceSummary?.status || 'NOT_STARTED'}</h5>
              <div className="text-muted small">{attendanceSummary?.checkedIn ? 'Currently checked in' : 'No active session'}</div>
            </div>
            <div className="text-start text-md-end">
              <div className="text-muted small">Today&apos;s total</div>
              <h5 className="fw-bold mb-0">{formatDuration(attendanceSummary?.totalWorkingHours)}</h5>
              <div className="text-muted small">{attendanceSummary?.sessions?.length || 0} session(s)</div>
            </div>
          </div>
          {attendanceSummary?.sessions?.length ? <div className="table-responsive mt-3"><table className="table table-sm mb-0"><thead><tr><th>Session</th><th>Check in</th><th>Check out</th></tr></thead><tbody>{attendanceSummary.sessions.map((session, index) => <tr key={session._id || index}><td>{index + 1}</td><td>{session.checkIn ? new Date(session.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{session.checkOut ? new Date(session.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Working now'}</td></tr>)}</tbody></table></div> : null}
        </div>
      </div>

      <div className="row g-4">

        {/* ================= PERSONAL INFORMATION ================= */}
        <div className="col-xl-8">

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <h5 className="fw-bold mb-1">
                Personal Information
              </h5>

              <p className="text-muted small mb-0">
                Employee personal and contact information
              </p>

            </div>

            <div className="card-body px-4">

              <div className="row g-4">

                <div className="col-md-6">
                  <label className="text-muted small">
                    Full Name
                  </label>

                  <div className="fw-semibold mt-1">
                    {displayName}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small">
                    Email Address
                  </label>

                  <div className="fw-semibold mt-1 text-break">
                    {current.email || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small">
                    Mobile Number
                  </label>

                  <div className="fw-semibold mt-1">
                    {displayMobile}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small">
                    Role
                  </label>

                  <div className="mt-1">
                    <span className="badge bg-primary-subtle text-primary text-capitalize">
                      {current.role || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small">
                    Employee ID
                  </label>

                  <div className="fw-semibold mt-1">
                    {employeeId || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-muted small">
                    User ID
                  </label>

                  <div className="fw-semibold mt-1 text-break small">
                    {current._id || current.id || 'N/A'}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ================= COMPANY INFORMATION ================= */}
          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <h5 className="fw-bold mb-1">
                Company Information
              </h5>

              <p className="text-muted small mb-0">
                Employment and organization details
              </p>

            </div>

            <div className="card-body px-4">

              <div className="row g-4">

                <div className="col-md-6">

                  <label className="text-muted small">
                    Company
                  </label>

                  <div className="fw-semibold mt-1">
                    {current.companyId?.name ||
                      current.companyId?.companyName ||
                      current.companyName ||
                      'N/A'}
                  </div>

                </div>

                <div className="col-md-6">

                  <label className="text-muted small">
                    Joining Date
                  </label>

                  <div className="fw-semibold mt-1">
                    {formatDate(joiningDate)}
                  </div>

                </div>

                <div className="col-md-6">

                  <label className="text-muted small">
                    Days With Company
                  </label>

                  <div className="fw-semibold mt-1">
                    {daysFromJoining !== null
                      ? `${daysFromJoining} days`
                      : 'N/A'}
                  </div>

                </div>

                <div className="col-md-6">

                  <label className="text-muted small">
                    Employment Status
                  </label>

                  <div className="mt-1">

                    {isActive ? (
                      <span className="badge bg-success">
                        Active Employee
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        Inactive Employee
                      </span>
                    )}

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ================= ADDITIONAL INFORMATION ================= */}
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <h5 className="fw-bold mb-1">
                System Information
              </h5>

              <p className="text-muted small mb-0">
                Account creation and modification details
              </p>

            </div>

            <div className="card-body px-4">

              <div className="row g-4">

                <div className="col-md-6">

                  <label className="text-muted small">
                    Created At
                  </label>

                  <div className="fw-semibold mt-1">
                    {formatDate(current.createdAt)}
                  </div>

                </div>

                <div className="col-md-6">

                  <label className="text-muted small">
                    Last Updated
                  </label>

                  <div className="fw-semibold mt-1">
                    {formatDate(current.updatedAt)}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="col-xl-4">

          {/* Account Status */}
          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <h5 className="fw-bold mb-1">
                Account Management
              </h5>

              <p className="text-muted small mb-0">
                Manage employee access
              </p>

            </div>

            <div className="card-body px-4">

              <div className="mb-3">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span className="text-muted">
                    Account
                  </span>

                  {isActive ? (
                    <span className="badge bg-success">
                      Active
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      Inactive
                    </span>
                  )}

                </div>

                <div className="d-flex justify-content-between align-items-center">

                  <span className="text-muted">
                    Block Status
                  </span>

                  {isBlocked ? (
                    <span className="badge bg-danger">
                      Blocked
                    </span>
                  ) : (
                    <span className="badge bg-success">
                      Normal
                    </span>
                  )}

                </div>

              </div>

              <hr />

              <div className="d-grid gap-2">

                <button
                  className="btn btn-warning"
                  onClick={() => handleStatus('disable')}
                  disabled={!isActive}
                >
                  Disable Account
                </button>

                <button
                  className="btn btn-success"
                  onClick={() => handleStatus('enable')}
                  disabled={isActive}
                >
                  Enable Account
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => handleStatus('block')}
                  disabled={isBlocked}
                >
                  Block User
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleStatus('unblock')}
                  disabled={!isBlocked}
                >
                  Unblock User
                </button>

              </div>

            </div>

          </div>

          {/* Employee Summary */}
          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <h6 className="fw-bold mb-3">
                Employee Summary
              </h6>

              <div className="d-flex justify-content-between mb-3">

                <span className="text-muted">
                  Role
                </span>

                <span className="fw-semibold text-capitalize">
                  {current.role || 'N/A'}
                </span>

              </div>

              <div className="d-flex justify-content-between mb-3">

                <span className="text-muted">
                  Joined
                </span>

                <span className="fw-semibold">
                  {formatDate(joiningDate)}
                </span>

              </div>

              <div className="d-flex justify-content-between">

                <span className="text-muted">
                  Tenure
                </span>

                <span className="fw-semibold">
                  {daysFromJoining !== null
                    ? `${daysFromJoining} days`
                    : 'N/A'}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default UserDetails
