import { useEffect, useState } from 'react'
import employeeProfileApi from '../../api/employeeProfileApi'

const ProfileReviews = () => {
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentLoading, setDocumentLoading] = useState(false)

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

  const download = async (url, fileName) => {
    try {
      setError('')

      const blob = await employeeProfileApi.downloadDocument(url)

      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = fileName || url.split('/').pop()

      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to download document'
      )
    }
  }

  const viewDocument = async document => {
    try {
      setDocumentLoading(true)
      setError('')
      setSelectedDocument(document)

      const blob = await employeeProfileApi.downloadDocument(
        document.url
      )

      const objectUrl = URL.createObjectURL(blob)

      setDocumentUrl(objectUrl)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to view document'
      )

      setSelectedDocument(null)
    } finally {
      setDocumentLoading(false)
    }
  }

  const closeDocument = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl)
    }

    setDocumentUrl('')
    setSelectedDocument(null)
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

  const submittedCount = profiles.filter(
    profile => profile.status === 'SUBMITTED'
  ).length

  const approvedCount = profiles.filter(
    profile => profile.status === 'APPROVED'
  ).length

  const rejectedCount = profiles.filter(
    profile => profile.status === 'REJECTED'
  ).length

  const filteredProfiles = profiles.filter(profile => {
    const name =
      profile.userId?.name?.toLowerCase() || ''

    const email =
      profile.userId?.email?.toLowerCase() || ''

    const role =
      profile.userId?.role?.toLowerCase() || ''

    const searchValue = search.toLowerCase().trim()

    return (
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      role.includes(searchValue)
    )
  })

  if (selectedDocument) {
    return (
      <div className="container-fluid py-4">

        <div className="d-flex align-items-center gap-3 mb-4">

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={closeDocument}
          >
            ← Back
          </button>

          <div>
            <h3 className="fw-bold mb-1">
              View Document
            </h3>

            <p className="text-muted mb-0">
              {selectedDocument.originalName ||
                selectedDocument.type ||
                'Employee Document'}
            </p>
          </div>

        </div>

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white d-flex justify-content-between align-items-center">

            <h5 className="fw-bold mb-0">
              {selectedDocument.originalName ||
                selectedDocument.type ||
                'Document'}
            </h5>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() =>
                download(
                  selectedDocument.url,
                  selectedDocument.originalName
                )
              }
            >
              ↓ Download
            </button>

          </div>

          <div
            className="card-body p-0 bg-light"
            style={{ minHeight: '75vh' }}
          >

            {documentLoading ? (

              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: '75vh' }}
              >

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />

                <span className="text-muted">
                  Loading document...
                </span>

              </div>

            ) : documentUrl ? (

              <iframe
                src={documentUrl}
                title={
                  selectedDocument.originalName ||
                  'Employee Document'
                }
                style={{
                  width: '100%',
                  height: '75vh',
                  border: 'none'
                }}
              />

            ) : (

              <div className="text-center p-5">

                <div className="alert alert-warning">
                  Unable to display this document.
                </div>

              </div>

            )}

          </div>

        </div>

      </div>
    )
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
            Review employee profiles and verify submitted documents.
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

              <h3 className="fw-bold mb-0">
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

      {!profiles.length ? (

        <div className="card border-0 shadow-sm">

          <div className="card-body text-center py-5">

            <h5 className="fw-bold">
              No employee profiles
            </h5>

            <p className="text-muted mb-0">
              There are no employee profiles available for review.
            </p>

          </div>

        </div>

      ) : (

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-0 p-4">

            <div className="row align-items-center g-3">

              <div className="col-lg-6">

                <h5 className="fw-bold mb-1">
                  Employee Profiles
                </h5>

                <p className="text-muted small mb-0">
                  Review employee information and uploaded documents.
                </p>

              </div>

              <div className="col-lg-6">

                <div className="input-group">

                  <span className="input-group-text bg-white">
                    🔍
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by employee name, email or role..."
                    value={search}
                    onChange={event =>
                      setSearch(event.target.value)
                    }
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
                <strong>
                  {filteredProfiles.length}
                </strong>{' '}
                of{' '}
                <strong>
                  {profiles.length}
                </strong>{' '}
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
                    Status
                  </th>

                  <th className="py-3">
                    Documents
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
                        Try searching with a different name,
                        email or role.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredProfiles.map(profile => {

                    const employee = profile.userId

                    return (
                      <tr key={profile._id}>

                        <td className="px-4">

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

                            <div>

                              <div className="fw-semibold">
                                {employee?.name ||
                                  'Unknown Employee'}
                              </div>

                              <div className="small text-muted">
                                {employee?.email ||
                                  'No email'}
                              </div>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="text-capitalize">
                            {employee?.role || 'N/A'}
                          </span>

                        </td>

                        <td>

                          {getStatusBadge(profile.status)}

                          {profile.rejectionReason && (
                            <div
                              className="small text-danger mt-2"
                              style={{
                                maxWidth: '220px'
                              }}
                            >
                              <strong>
                                Reason:
                              </strong>{' '}
                              {profile.rejectionReason}
                            </div>
                          )}

                        </td>

                        <td>

                          {profile.documents?.length ? (

                            <div className="d-flex flex-column gap-2">

                              {profile.documents.map(
                                document => (

                                  <div
                                    key={document.url}
                                    className="d-flex align-items-center gap-2"
                                  >

                                    <span
                                      className="text-truncate"
                                      style={{
                                        maxWidth: '180px'
                                      }}
                                    >
                                      📎{' '}
                                      {document.originalName ||
                                        document.type}
                                    </span>

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() =>
                                        viewDocument(
                                          document
                                        )
                                      }
                                    >
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        download(
                                          document.url,
                                          document.originalName
                                        )
                                      }
                                    >
                                      Download
                                    </button>

                                  </div>

                                )
                              )}

                            </div>

                          ) : (

                            <span className="text-muted small">
                              No documents
                            </span>

                          )}

                        </td>

                        <td className="text-end pe-4">

                          {profile.status === 'SUBMITTED' ? (

                            <div className="d-flex justify-content-end gap-2">

                              <button
                                type="button"
                                className="btn btn-sm btn-success px-3"
                                disabled={
                                  reviewingId ===
                                  profile._id
                                }
                                onClick={() =>
                                  review(
                                    profile._id,
                                    'APPROVED'
                                  )
                                }
                              >
                                {reviewingId ===
                                profile._id
                                  ? 'Processing...'
                                  : 'Approve'}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger px-3"
                                disabled={
                                  reviewingId ===
                                  profile._id
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

                            <span className="text-muted small">
                              Reviewed
                            </span>

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

      )}

    </div>
  )
}

export default ProfileReviews