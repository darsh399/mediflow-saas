import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import employeeProfileApi from '../../api/employeeProfileApi'
import { useNotify } from '../../components/NotificationProvider'

const ProfileReviewDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotify()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [verifyingId, setVerifyingId] = useState(null)
  const [requestingReupload, setRequestingReupload] = useState(false)

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentLoading, setDocumentLoading] = useState(false)
  const role = useSelector(state => state.auth.user?.role)
  const canVerify = ['admin', 'company_owner', 'hr_manager', 'hr'].includes(role)

  const loadProfile = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      setError('')

      const response =
        await employeeProfileApi.listProfiles()

      const foundProfile =
        response.profiles?.find(
          item => item._id === id
        )

      if (!foundProfile) {
        setError('Employee profile not found')
        return
      }

      setProfile(foundProfile)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to load employee profile'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const review = async status => {
    let rejectionReason

    if (status === 'REJECTED') {
      rejectionReason = window.prompt(
        'Please enter the reason for rejecting this profile:'
      )

      if (!rejectionReason?.trim()) return
    }

    try {
      setReviewing(true)
      setError('')

      await employeeProfileApi.reviewProfile(id, {
        status,
        rejectionReason
      })

      notify(`Profile ${status === 'APPROVED' ? 'approved' : 'rejected'}`)
      await loadProfile({ silent: true })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to review profile'
      )
    } finally {
      setReviewing(false)
    }
  }

  const download = async (url, fileName) => {
    try {
      const blob =
        await employeeProfileApi.downloadDocument(url)

      const objectUrl =
        URL.createObjectURL(blob)

      const link =
        document.createElement('a')

      link.href = objectUrl
      link.download =
        fileName || url.split('/').pop()

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

  const viewDocument = async documentItem => {
    try {
      setDocumentLoading(true)
      setError('')
      setSelectedDocument(documentItem)

      const blob =
        await employeeProfileApi.downloadDocument(
          documentItem.url
        )

      const objectUrl =
        URL.createObjectURL(blob)

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

  const verify = async documentItem => {
    if (!documentItem._id || verifyingId) return
    setVerifyingId(documentItem._id)
    setError('')
    try {
      // Update only this document in place — no full-page reload / redirect.
      const response = await employeeProfileApi.verifyDocument(
        profile.userId._id,
        documentItem._id,
        !documentItem.verified
      )
      setProfile(current => ({
        ...current,
        documents: (current.documents || []).map(item =>
          item._id === documentItem._id ? { ...item, ...(response.document || {}) } : item
        ),
      }))
    } catch (err) {
      const status = err?.response?.status
      setError(
        err?.response?.data?.message ||
        `Could not update verification${status ? ` (HTTP ${status})` : ''}. Please try again.`
      )
    } finally {
      setVerifyingId(null)
    }
  }

  const requestReupload = async () => {
    const unverified = (profile?.documents || []).filter(item => !item.verified)
    if (unverified.length === 0) return
    const note = window.prompt(
      `Ask ${profile.userId?.name || 'the employee'} to re-upload ${unverified.length} unverified document(s)?\n\nOptional note for the employee:`,
      ''
    )
    if (note === null) return
    setRequestingReupload(true)
    setError('')
    try {
      const response = await employeeProfileApi.requestDocumentReupload(profile.userId._id, note.trim())
      notify(response.message || 'Employee notified to re-upload documents')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to notify the employee')
    } finally {
      setRequestingReupload(false)
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

  const getJoiningDate = employee => {
    return (
      employee?.joiningDate ||
      employee?.dateOfJoining ||
      employee?.joinDate
    )
  }

  const calculateExperience = joiningDate => {
    if (!joiningDate) {
      return {
        days: 'N/A',
        years: 'N/A'
      }
    }

    const start = new Date(joiningDate)
    const today = new Date()

    const difference =
      today.getTime() - start.getTime()

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    )

    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)

    return {
      days,
      years: `${years} years ${months} months`
    }
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

            <p className="text-muted mb-0">
              Loading employee details...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container-fluid py-4">

        <button
          className="btn btn-outline-secondary mb-4"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="alert alert-danger">
          {error}
        </div>

      </div>
    )
  }

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

            ) : null}

          </div>

        </div>

      </div>
    )
  }

  const employee = profile?.userId
  const joiningDate = getJoiningDate(employee)
  const experience = calculateExperience(joiningDate)

  const documents = profile?.documents || []
  const verifiedCount = documents.filter(document => document.verified).length
  const unverifiedCount = documents.length - verifiedCount
  const isSubmitted = profile?.status === 'SUBMITTED'
  const canReview = Boolean(profile?.reviewEligibility?.canReview)

  return (
    <div className="container-fluid py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <button
            type="button"
            className="btn btn-outline-secondary mb-3"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <h2 className="fw-bold mb-1">
            Employee Profile
          </h2>

          <p className="text-muted mb-0">
            Complete employee information and document verification
          </p>
        </div>

      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="d-flex flex-wrap align-items-center gap-4">

            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: '80px',
                height: '80px',
                fontSize: '25px'
              }}
            >
              {getInitials(employee?.name)}
            </div>

            <div className="flex-grow-1">

              <h3 className="fw-bold mb-1">
                {employee?.name || 'N/A'}
              </h3>

              <p className="text-muted mb-2">
                {employee?.email || 'N/A'}
              </p>

              <div className="d-flex flex-wrap gap-2">

                <span className="badge bg-primary-subtle text-primary px-3 py-2">
                  {employee?.role || 'N/A'}
                </span>

                {profile?.status === 'APPROVED' && (
                  <span className="badge bg-success-subtle text-success px-3 py-2">
                    Approved
                  </span>
                )}

                {profile?.status === 'SUBMITTED' && (
                  <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-2">
                    Pending Review
                  </span>
                )}

                {profile?.status === 'REJECTED' && (
                  <span className="badge bg-danger-subtle text-danger px-3 py-2">
                    Rejected
                  </span>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

      <div className="row g-4 mb-4">

        <div className="col-xl-8">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-0">
                Personal Information
              </h5>
            </div>

            <div className="card-body p-4">

              <div className="row g-4">

                <div className="col-md-6">
                  <small className="text-muted">
                    Full Name
                  </small>

                  <div className="fw-semibold mt-1">
                    {employee?.name || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    Email
                  </small>

                  <div className="fw-semibold mt-1">
                    {employee?.email || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    Mobile Number
                  </small>

                  <div className="fw-semibold mt-1">
                    {employee?.mobile ||
                      employee?.phone ||
                      'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    Role
                  </small>

                  <div className="fw-semibold mt-1 text-capitalize">
                    {employee?.role || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    Company
                  </small>

                  <div className="fw-semibold mt-1">
                    {employee?.companyId?.name ||
                      employee?.companyName ||
                      'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    Employee ID
                  </small>

                  <div className="fw-semibold mt-1 text-break">
                    {employee?._id || 'N/A'}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="col-xl-4">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-0">
                Employment Information
              </h5>
            </div>

            <div className="card-body p-4">

              <div className="mb-4">

                <small className="text-muted">
                  Joining Date
                </small>

                <div className="fw-bold mt-1">
                  {joiningDate
                    ? new Date(
                        joiningDate
                      ).toLocaleDateString()
                    : 'N/A'}
                </div>

              </div>

              <div className="mb-4">

                <small className="text-muted">
                  Days Since Joining
                </small>

                <div className="fw-bold fs-4 text-primary mt-1">
                  {experience.days}
                </div>

              </div>

              <div className="mb-4">

                <small className="text-muted">
                  Tenure at Company
                </small>

                <div className="fw-bold mt-1">
                  {experience.years}
                </div>

              </div>

              <div className="mb-4">

                <small className="text-muted">
                  Prior Experience
                </small>

                <div className="fw-bold mt-1">
                  {profile?.experienceType === 'fresher'
                    ? 'Fresher'
                    : [
                        profile?.profileData?.totalExperienceYears ? `${profile.profileData.totalExperienceYears} year(s)` : null,
                        profile?.profileData?.previousCompany ? `at ${profile.profileData.previousCompany}` : null,
                      ].filter(Boolean).join(' ')
                      || (profile?.experienceType === 'experienced' ? 'Experienced' : 'Not provided')}
                </div>

              </div>

              <div>

                <small className="text-muted">
                  Employment Type
                </small>

                <div className="fw-bold mt-1 text-capitalize">
                  {employee?.employmentType?.toLowerCase().replace(/_/g, ' ') || 'N/A'}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      <div className="row g-4 mb-4">

        <div className="col-xl-6">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-0">
                Onboarding Status
              </h5>
            </div>

            <div className="card-body p-4">

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Profile Completion</small>
                  <small className="fw-bold">{profile?.completion?.percentage || 0}%</small>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${(profile?.completion?.percentage || 0) >= 100 ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${profile?.completion?.percentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="row g-4">

                <div className="col-md-6">
                  <small className="text-muted">Review Status</small>
                  <div className="fw-semibold mt-1">
                    {profile?.status || 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">Submitted At</small>
                  <div className="fw-semibold mt-1">
                    {profile?.submittedAt ? new Date(profile.submittedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">Created By</small>
                  <div className="fw-semibold mt-1">
                    {employee?.createdBy?.name || employee?.createdBy?.email || 'Self-registered'}
                  </div>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">Reviewed By</small>
                  <div className="fw-semibold mt-1">
                    {profile?.reviewedBy?.name || profile?.reviewedBy?.email || 'Not yet reviewed'}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="col-xl-6">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-0">
                Bank Details
              </h5>
            </div>

            <div className="card-body p-4">

              {profile?.bankDetails ? (
                <div className="row g-4">

                  <div className="col-md-6">
                    <small className="text-muted">Account Holder</small>
                    <div className="fw-semibold mt-1">{profile.bankDetails.accountHolderName || 'N/A'}</div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted">Bank Name</small>
                    <div className="fw-semibold mt-1">{profile.bankDetails.bankName || 'N/A'}</div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted">Account Number</small>
                    <div className="fw-semibold mt-1">{profile.bankDetails.accountNumberMasked || 'N/A'}</div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted">IFSC Code</small>
                    <div className="fw-semibold mt-1">{profile.bankDetails.ifscCode || 'N/A'}</div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted">Branch</small>
                    <div className="fw-semibold mt-1">{profile.bankDetails.branchName || 'N/A'}</div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted">Account Type</small>
                    <div className="fw-semibold mt-1 text-capitalize">{profile.bankDetails.accountType?.toLowerCase() || 'N/A'}</div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">No bank details on file.</p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white border-0 p-4">

          <div className="d-flex justify-content-between align-items-center">

            <div>
              <h5 className="fw-bold mb-1">
                Employee Documents
              </h5>

              <p className="text-muted small mb-0">
                View or download submitted documents.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              {documents.length > 0 && (
                <span className={`badge px-3 py-2 ${unverifiedCount === 0 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                  {verifiedCount} / {documents.length} verified
                </span>
              )}
              {canVerify && unverifiedCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={requestingReupload}
                  onClick={requestReupload}
                >
                  <i className="bi bi-send me-1"></i>
                  {requestingReupload ? 'Sending…' : 'Request re-upload'}
                </button>
              )}
            </div>

          </div>

        </div>

        <div className="card-body p-4">

          {profile?.documents?.length ? (

            <div className="row g-3">

              {profile.documents.map(document => (

                <div
                  className="col-xl-6"
                  key={document.url}
                >

                  <div className="border rounded p-3 d-flex justify-content-between align-items-center">

                    <div className="d-flex align-items-center gap-3">

                      <div
                        className="bg-light rounded p-3"
                        style={{ fontSize: '20px' }}
                      >
                        📄
                      </div>

                      <div>

                        <div className="fw-semibold">
                          {document.originalName ||
                            document.type ||
                            'Document'}
                        </div>

                        <small className="text-muted">
                          {document.type || 'Uploaded document'}{document.expiresAt ? ` · Expires ${new Date(document.expiresAt).toLocaleDateString()}` : ''}
                        </small>

                      </div>

                    </div>

                    <div className="d-flex gap-2">

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          viewDocument(document)
                        }
                      >
                        View
                      </button>

                      {canVerify && document._id && (
                        <button
                          type="button"
                          className={`btn btn-sm ${document.verified ? 'btn-success' : 'btn-outline-success'}`}
                          disabled={verifyingId === document._id}
                          onClick={() => verify(document)}
                        >
                          {verifyingId === document._id
                            ? '…'
                            : document.verified
                              ? <><i className="bi bi-check-lg me-1"></i>Verified</>
                              : 'Verify'}
                        </button>
                      )}
                      {canVerify && !document._id && (
                        <span className="badge bg-secondary-subtle text-secondary align-self-center" title="This document was uploaded by an older version and cannot be verified. Ask the employee to re-upload it.">
                          Legacy upload
                        </span>
                      )}

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

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="text-center py-4">
              <p className="text-muted mb-0">
                No documents submitted.
              </p>
            </div>

          )}

        </div>

      </div>

      {profile?.rejectionReason && (
        <div className="alert alert-danger border-0 shadow-sm">
          <strong>Rejection Reason:</strong>{' '}
          {profile.rejectionReason}
        </div>
      )}

      {isSubmitted && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

              <div>
                <h5 className="fw-bold mb-1">Profile Review</h5>
                <p className="text-muted mb-0">
                  {documents.length > 0
                    ? `${verifiedCount} of ${documents.length} documents verified.`
                    : 'No documents submitted.'}
                  {unverifiedCount > 0 && ' Verify or request a re-upload of the rest before approving.'}
                </p>
              </div>

              {canReview ? (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-success px-4"
                    disabled={reviewing}
                    onClick={() => review('APPROVED')}
                  >
                    {reviewing ? 'Processing...' : 'Approve Profile'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger px-4"
                    disabled={reviewing}
                    onClick={() => review('REJECTED')}
                  >
                    Reject Profile
                  </button>
                </div>
              ) : canVerify && unverifiedCount > 0 ? (
                <button
                  type="button"
                  className="btn btn-outline-primary px-4"
                  disabled={requestingReupload}
                  onClick={requestReupload}
                >
                  <i className="bi bi-send me-1"></i>Request document re-upload
                </button>
              ) : null}

            </div>

            {!canReview && (
              <div className="alert alert-info border-0 mt-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                {profile?.reviewEligibility?.reason
                  || 'Only a company owner or HR manager can approve or reject this profile. You can still verify documents and request re-uploads.'}
              </div>
            )}

            {canReview && unverifiedCount > 0 && (
              <div className="alert alert-warning border-0 mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {unverifiedCount} document(s) are still unverified.
              </div>
            )}

          </div>

        </div>

      )}

    </div>
  )
}

export default ProfileReviewDetails;