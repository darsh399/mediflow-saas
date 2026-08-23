import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import employeeProfileApi from '../../api/employeeProfileApi'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

const documentTypes = [
  'aadhar',
  'pan',
  'addressProof',
  'tenth',
  'twelfth',
  'degree',
  'passportPhoto'
]

const experiencedDocuments = [
  'offerLetter',
  'relievingLetter',
  'salarySlips'
]

const formatLabel = value => {
  return value
    .replace(/[A-Z]/g, match => ` ${match}`)
    .replace(/^./, match => match.toUpperCase())
}

const getDocumentUrl = document => {
  if (!document) return null

  let url = null

  if (typeof document === 'string') {
    url = document
  } else {
    url =
      document.url ||
      document.fileUrl ||
      document.path ||
      document.location ||
      document.filePath ||
      document.secure_url ||
      document.secureUrl ||
      null
  }

  if (!url) return null

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:')
  ) {
    return url
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`
  }

  return `${API_BASE_URL}/${url}`
}

const getFileName = document => {
  if (!document) return ''

  if (typeof document === 'string') {
    return document.split('/').pop()
  }

  return (
    document.originalName ||
    document.originalname ||
    document.filename ||
    document.fileName ||
    document.name ||
    'Uploaded document'
  )
}

const EmployeeOnboarding = () => {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)

  const [profileData, setProfileData] = useState({
    fullName: '',
    dob: '',
    mobile: '',
    bloodGroup: '',
    emergencyContact: '',
    currentAddress: '',
    permanentAddress: ''
  })

  const [experienceType, setExperienceType] = useState('fresher')

  const [files, setFiles] = useState({})
  const [experienceFiles, setExperienceFiles] = useState({})

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await employeeProfileApi.getMyProfile()

      console.log('MY PROFILE RESPONSE:', response)

      if (response.profile) {
        const currentProfile = response.profile

        setProfile(currentProfile)

        setProfileData(data => ({
          ...data,
          ...(currentProfile.profileData || {})
        }))

        setExperienceType(
          currentProfile.experienceType || 'fresher'
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        err?.response?.data?.message ||
        'Unable to load profile'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const updateField = event => {
    setProfileData(data => ({
      ...data,
      [event.target.name]: event.target.value
    }))
  }

  const saveDraft = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response =
        await employeeProfileApi.saveProfile({
          profileData,
          experienceType
        })

      setProfile(response.profile)

      setMessage('Draft saved successfully')

      await loadProfile()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to save draft'
      )
    } finally {
      setSaving(false)
    }
  }

  const uploadFiles = async () => {
    const normalEntries = Object
      .entries(files)
      .filter(([, file]) => file)

    const experienceEntries =
      experienceType === 'experienced'
        ? Object
            .entries(experienceFiles)
            .filter(([, file]) => file)
        : []

    if (
      !normalEntries.length &&
      !experienceEntries.length
    ) {
      return
    }

    const formData = new FormData()

    normalEntries.forEach(([type, file]) => {
      if (type === 'passportPhoto') {
        formData.append('profileImage', file)
      } else {
        formData.append('documents', file)
        formData.append('documentType', type)
      }
    })

    experienceEntries.forEach(([type, file]) => {
      formData.append('documents', file)
      formData.append('documentType', type)
    })

    await employeeProfileApi.uploadDocuments(formData)
  }

  const submit = async event => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await employeeProfileApi.saveProfile({
        profileData,
        experienceType
      })

      await uploadFiles()

      const response =
        await employeeProfileApi.submitProfile()

      setProfile(response.profile)

      setMessage(
        'Profile submitted for review successfully'
      )

      setFiles({})
      setExperienceFiles({})

      await loadProfile()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to submit profile'
      )
    } finally {
      setSaving(false)
    }
  }

  const locked = [
    'SUBMITTED',
    'APPROVED'
  ].includes(profile?.status)

  const getUploadedDocument = type => {
    if (type === 'passportPhoto') {
      return (
        profile?.profileImage ||
        profile?.profileData?.profileImage ||
        null
      )
    }

    if (Array.isArray(profile?.documents)) {
      const document = profile.documents.find(item => {
        const documentType =
          item.documentType ||
          item.type ||
          item.name

        return documentType === type
      })

      return document || null
    }

    if (profile?.documents?.[type]) {
      return profile.documents[type]
    }

    if (profile?.profileData?.documents?.[type]) {
      return profile.profileData.documents[type]
    }

    return null
  }

  const getStatusClass = status => {
    switch (status) {
      case 'APPROVED':
        return 'bg-success'

      case 'SUBMITTED':
        return 'bg-warning text-dark'

      case 'REJECTED':
        return 'bg-danger'

      default:
        return 'bg-secondary'
    }
  }

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">

          <div
            className="spinner-border text-primary"
            style={{
              width: '3rem',
              height: '3rem'
            }}
          />

          <p className="text-muted mt-3">
            Loading your profile...
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">

      <div className="d-flex align-items-center mb-4">
        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i>
          Back
        </button>
      </div>

      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >

        <div
          className="p-4 text-white"
          style={{
            background:
              'linear-gradient(135deg, #0d6efd, #6610f2)'
          }}
        >

          <div className="row align-items-center">

            <div className="col-md-8">

              <div className="d-flex align-items-center gap-3">

                <div
                  className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '65px',
                    height: '65px',
                    fontSize: '24px'
                  }}
                >
                  {profileData.fullName
                    ? profileData.fullName
                        .charAt(0)
                        .toUpperCase()
                    : 'U'}
                </div>

                <div>

                  <h2 className="mb-1">
                    {profileData.fullName ||
                      'My Profile'}
                  </h2>

                  <p className="mb-0 opacity-75">
                    Employee Profile & Onboarding
                  </p>

                </div>

              </div>

            </div>

            <div className="col-md-4 text-md-end mt-3 mt-md-0">

              {profile?.status && (
                <span
                  className={`badge ${getStatusClass(
                    profile.status
                  )} px-3 py-2`}
                  style={{
                    fontSize: '14px'
                  }}
                >
                  {profile.status}
                </span>
              )}

            </div>

          </div>

        </div>

      </div>

      {message && (
        <div className="alert alert-success shadow-sm">
          <strong>Success:</strong> {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white border-0 p-4">

          <div className="d-flex align-items-center">

            <div
              className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center me-3"
              style={{
                width: '45px',
                height: '45px'
              }}
            >
              <i className="bi bi-person fs-4" />
            </div>

            <div>
              <h5 className="mb-1">
                Personal Information
              </h5>

              <small className="text-muted">
                Your personal and contact details
              </small>
            </div>

          </div>

        </div>

        <div className="card-body p-4">

          <div className="row">

            {Object.entries(profileData).map(
              ([name, value]) => (

                <div
                  className="col-lg-6 mb-4"
                  key={name}
                >

                  <label className="form-label fw-semibold text-secondary">
                    {formatLabel(name)}
                  </label>

                  {name.includes('Address') ||
                  name === 'emergencyContact' ? (

                    <textarea
                      className="form-control"
                      name={name}
                      value={value || ''}
                      onChange={updateField}
                      disabled={locked}
                      rows="3"
                    />

                  ) : (

                    <input
                      className="form-control"
                      name={name}
                      type={
                        name === 'dob'
                          ? 'date'
                          : 'text'
                      }
                      value={value || ''}
                      onChange={updateField}
                      disabled={locked}
                    />

                  )}

                </div>

              )
            )}

          </div>

        </div>

      </div>

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white border-0 p-4">

          <div className="d-flex align-items-center">

            <div
              className="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center me-3"
              style={{
                width: '45px',
                height: '45px'
              }}
            >
              <i className="bi bi-briefcase fs-4" />
            </div>

            <div>

              <h5 className="mb-1">
                Experience
              </h5>

              <small className="text-muted">
                Select your professional experience
              </small>

            </div>

          </div>

        </div>

        <div className="card-body p-4">

          <select
            className="form-select"
            value={experienceType}
            onChange={event =>
              setExperienceType(
                event.target.value
              )
            }
            disabled={locked}
          >

            <option value="fresher">
              Fresher
            </option>

            <option value="experienced">
              Experienced
            </option>

          </select>

        </div>

      </div>

      {experienceType === 'experienced' && (

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-header bg-white border-0 p-4">

            <div className="d-flex align-items-center">

              <div
                className="bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '45px',
                  height: '45px'
                }}
              >
                <i className="bi bi-folder2-open fs-4" />
              </div>

              <div>

                <h5 className="mb-1">
                  Experience Documents
                </h5>

                <small className="text-muted">
                  Previous employment documents
                </small>

              </div>

            </div>

          </div>

          <div className="card-body p-4">

            <div className="row">

              {experiencedDocuments.map(type => {

                const document =
                  getUploadedDocument(type)

                const url =
                  getDocumentUrl(document)

                const fileName =
                  getFileName(document)

                return (

                  <div
                    className="col-lg-4 col-md-6 mb-3"
                    key={type}
                  >

                    <div
                      className="border rounded-3 p-3 h-100"
                      style={{
                        background: '#fafbff'
                      }}
                    >

                      <div className="d-flex justify-content-between align-items-start">

                        <div>

                          <div className="fw-semibold">
                            {formatLabel(type)}
                          </div>

                          {url ? (
                            <small className="text-success">
                              ✓ Uploaded
                            </small>
                          ) : (
                            <small className="text-muted">
                              Not uploaded
                            </small>
                          )}

                        </div>

                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1" />
                            View
                          </a>
                        )}

                      </div>

                      {fileName && (
                        <div
                          className="small text-muted mt-2 text-truncate"
                          title={fileName}
                        >
                          {fileName}
                        </div>
                      )}

                      {!locked && (
                        <input
                          className="form-control form-control-sm mt-3"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={event =>
                            setExperienceFiles(
                              current => ({
                                ...current,
                                [type]:
                                  event.target.files[0]
                              })
                            )
                          }
                        />
                      )}

                    </div>

                  </div>

                )
              })}

            </div>

          </div>

        </div>

      )}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white border-0 p-4">

          <div className="d-flex align-items-center">

            <div
              className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center me-3"
              style={{
                width: '45px',
                height: '45px'
              }}
            >
              <i className="bi bi-file-earmark-text fs-4" />
            </div>

            <div>

              <h5 className="mb-1">
                Personal Documents
              </h5>

              <small className="text-muted">
                Your uploaded identification and education documents
              </small>

            </div>

          </div>

        </div>

        <div className="card-body p-4">

          <div className="row">

            {documentTypes.map(type => {

              const document =
                getUploadedDocument(type)

              const url =
                getDocumentUrl(document)

              const fileName =
                getFileName(document)

              return (

                <div
                  className="col-lg-4 col-md-6 mb-3"
                  key={type}
                >

                  <div
                    className="border rounded-3 p-3 h-100"
                    style={{
                      background: '#fafbff'
                    }}
                  >

                    <div className="d-flex justify-content-between align-items-start">

                      <div className="d-flex gap-2">

                        <div
                          className="text-primary bg-primary bg-opacity-10 rounded-2 d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px'
                          }}
                        >
                          <i className="bi bi-file-earmark" />
                        </div>

                        <div>

                          <div className="fw-semibold">
                            {formatLabel(type)}
                          </div>

                          {url ? (
                            <small className="text-success">
                              ✓ Uploaded
                            </small>
                          ) : (
                            <small className="text-muted">
                              Not uploaded
                            </small>
                          )}

                        </div>

                      </div>

                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-eye me-1" />
                          View
                        </a>
                      )}

                    </div>

                    {fileName && (
                      <div
                        className="small text-muted mt-2 text-truncate"
                        title={fileName}
                      >
                        {fileName}
                      </div>
                    )}

                    {!locked && (
                      <input
                        className="form-control form-control-sm mt-3"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={event =>
                          setFiles(current => ({
                            ...current,
                            [type]:
                              event.target.files[0]
                          }))
                        }
                      />
                    )}

                  </div>

                </div>

              )
            })}

          </div>

        </div>

      </div>

      {!locked && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex flex-wrap gap-2">

              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={saveDraft}
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2" />
                    Save Draft
                  </>
                )}

              </button>

              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={submit}
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2" />
                    Submit for Review
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default EmployeeOnboarding