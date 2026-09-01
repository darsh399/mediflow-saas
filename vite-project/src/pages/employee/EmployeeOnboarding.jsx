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

  const url = typeof document === 'string'
    ? document
    : document.url || document.fileUrl || document.path || document.location || document.filePath || document.secure_url || document.secureUrl || null

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

const openPrivateDocument = async document => {
  const source = getDocumentUrl(document)
  if (!source) return
  const tab = window.open('about:blank', '_blank', 'noopener,noreferrer')
  try {
    const blob = await employeeProfileApi.downloadDocument(source)
    const blobUrl = URL.createObjectURL(blob)
    if (tab) tab.location.href = blobUrl
    else window.open(blobUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  } catch (err) {
    if (tab) tab.close()
    throw err
  }
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
  const [experienceInfo, setExperienceInfo] = useState({ previousCompany: '', totalExperienceYears: '' })

  const [files, setFiles] = useState({})
  const [experienceFiles, setExperienceFiles] = useState({})

  const [completion, setCompletion] = useState(null)

  const [bankForm, setBankForm] = useState({ accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', branchName: '', accountType: 'SAVINGS' })
  const [bankDetails, setBankDetails] = useState(null)
  const [bankSaving, setBankSaving] = useState(false)
  const [bankError, setBankError] = useState('')
  const [bankMessage, setBankMessage] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await employeeProfileApi.getMyProfile()

      if (response.profile) {
        const currentProfile = response.profile

        setProfile(currentProfile)

        {
          const { previousCompany, totalExperienceYears, ...restProfileData } = currentProfile.profileData || {}
          setProfileData(data => ({ ...data, ...restProfileData }))
          setExperienceInfo({
            previousCompany: previousCompany || '',
            totalExperienceYears: totalExperienceYears || '',
          })
        }

        setExperienceType(
          currentProfile.experienceType || 'fresher'
        )

        if (currentProfile.bankDetails) {
          setBankDetails(currentProfile.bankDetails)
          setBankForm(current => ({ ...current, accountHolderName: currentProfile.bankDetails.accountHolderName || '', bankName: currentProfile.bankDetails.bankName || '', ifscCode: currentProfile.bankDetails.ifscCode || '', branchName: currentProfile.bankDetails.branchName || '', accountType: currentProfile.bankDetails.accountType || 'SAVINGS' }))
        }
      }

      setCompletion(response.completion || null)
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

  // Experience company / years are folded into profileData only when the
  // employee is "experienced" — cleared otherwise so they never linger.
  const profileDataPayload = () => ({
    ...profileData,
    previousCompany: experienceType === 'experienced' ? experienceInfo.previousCompany.trim() : '',
    totalExperienceYears: experienceType === 'experienced' ? experienceInfo.totalExperienceYears : '',
  })

  const saveDraft = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response =
        await employeeProfileApi.saveProfile({
          profileData: profileDataPayload(),
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

  const updateBankField = event => {
    setBankForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const saveBankDetails = async event => {
    event.preventDefault()
    setBankError('')
    setBankMessage('')

    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setBankError('Account number and confirmation do not match')
      return
    }
    if (!/^\d{9,18}$/.test(bankForm.accountNumber)) {
      setBankError('Account number must be 9-18 digits')
      return
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.toUpperCase())) {
      setBankError('Enter a valid IFSC code, e.g. HDFC0001234')
      return
    }

    try {
      setBankSaving(true)
      const response = await employeeProfileApi.saveBankDetails({ ...bankForm, ifscCode: bankForm.ifscCode.toUpperCase() })
      setBankDetails(response.bankDetails)
      setCompletion(response.completion)
      setBankMessage('Bank details saved successfully')
      setBankForm(current => ({ ...current, accountNumber: '', confirmAccountNumber: '' }))
    } catch (err) {
      setBankError(err?.response?.data?.message || 'Unable to save bank details')
    } finally {
      setBankSaving(false)
    }
  }

  const submit = async event => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await employeeProfileApi.saveProfile({
        profileData: profileDataPayload(),
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
              'linear-gradient(135deg, var(--mf-color-primary), var(--mf-color-accent))'
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

      {completion && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Profile Completion</h5>
              <span className="fw-bold fs-5 text-primary">{completion.percentage}%</span>
            </div>
            <div className="progress mb-3" style={{ height: '10px' }}>
              <div className={`progress-bar ${completion.percentage >= 100 ? 'bg-success' : 'bg-primary'}`} role="progressbar" style={{ width: `${completion.percentage}%` }} aria-valuenow={completion.percentage} aria-valuemin="0" aria-valuemax="100" />
            </div>
            <p className="text-muted small mb-3">{completion.percentage >= 100 ? 'Your profile is complete.' : 'Complete your profile to continue.'}</p>
            <div className="row g-2">
              {Object.values(completion.sections || {}).map((section) => (
                <div className="col-sm-6 col-lg-3" key={section.label}>
                  <div className={`border rounded-3 p-2 d-flex align-items-center gap-2 ${section.complete ? 'border-success-subtle bg-success-subtle' : 'border-warning-subtle bg-warning-subtle'}`}>
                    <i className={`bi ${section.complete ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'}`}></i>
                    <div className="small">
                      <div className="fw-semibold">{section.label}</div>
                      <div className="text-muted">{section.percentage}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

          {experienceType === 'experienced' && (
            <div className="row g-3 mt-2">
              <div className="col-md-7">
                <label className="form-label fw-semibold text-secondary">Previous company</label>
                <input
                  className="form-control"
                  value={experienceInfo.previousCompany}
                  disabled={locked}
                  placeholder="e.g. Acme Pharma Pvt Ltd"
                  onChange={event => setExperienceInfo(info => ({ ...info, previousCompany: event.target.value }))}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-semibold text-secondary">Total experience (years)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control"
                  value={experienceInfo.totalExperienceYears}
                  disabled={locked}
                  placeholder="e.g. 3"
                  onChange={event => setExperienceInfo(info => ({ ...info, totalExperienceYears: event.target.value }))}
                />
              </div>
            </div>
          )}

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
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openPrivateDocument(document).catch(() => setError('Unable to open document'))}
                          >
                            <i className="bi bi-eye me-1" />
                            View
                          </button>
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
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openPrivateDocument(document).catch(() => setError('Unable to open document'))}
                        >
                          <i className="bi bi-eye me-1" />
                          View
                        </button>
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

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white border-0 p-4">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
              <i className="bi bi-bank fs-4" />
            </div>
            <div>
              <h5 className="mb-1">Bank Details</h5>
              <small className="text-muted">Required for salary payments and salary slips</small>
            </div>
          </div>
        </div>

        <div className="card-body p-4">

          {bankMessage && <div className="alert alert-success py-2 small">{bankMessage}</div>}
          {bankError && <div className="alert alert-danger py-2 small">{bankError}</div>}

          {bankDetails && (
            <div className="border rounded-3 p-3 mb-3 bg-light">
              <div className="row small">
                <div className="col-md-6 mb-2"><span className="text-muted">Account Holder:</span> <strong>{bankDetails.accountHolderName}</strong></div>
                <div className="col-md-6 mb-2"><span className="text-muted">Bank:</span> <strong>{bankDetails.bankName}</strong></div>
                <div className="col-md-6 mb-2"><span className="text-muted">Account Number:</span> <strong>{bankDetails.accountNumberMasked}</strong></div>
                <div className="col-md-6 mb-2"><span className="text-muted">IFSC:</span> <strong>{bankDetails.ifscCode}</strong></div>
                <div className="col-md-6"><span className="text-muted">Branch:</span> <strong>{bankDetails.branchName}</strong></div>
                <div className="col-md-6"><span className="text-muted">Account Type:</span> <strong>{bankDetails.accountType}</strong></div>
              </div>
            </div>
          )}

          <form onSubmit={saveBankDetails}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary">Account Holder Name</label>
                <input required className="form-control" name="accountHolderName" value={bankForm.accountHolderName} onChange={updateBankField} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary">Bank Name</label>
                <input required className="form-control" name="bankName" value={bankForm.bankName} onChange={updateBankField} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary">Account Number</label>
                <input required className="form-control" name="accountNumber" value={bankForm.accountNumber} onChange={updateBankField} placeholder={bankDetails ? 'Enter to update saved number' : ''} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary">Confirm Account Number</label>
                <input required className="form-control" name="confirmAccountNumber" value={bankForm.confirmAccountNumber} onChange={updateBankField} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary">IFSC Code</label>
                <input required className="form-control text-uppercase" name="ifscCode" value={bankForm.ifscCode} onChange={updateBankField} placeholder="HDFC0001234" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary">Branch Name</label>
                <input required className="form-control" name="branchName" value={bankForm.branchName} onChange={updateBankField} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary">Account Type</label>
                <select className="form-select" name="accountType" value={bankForm.accountType} onChange={updateBankField}>
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4" disabled={bankSaving}>
              {bankSaving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-save me-2" />Save Bank Details</>}
            </button>
          </form>

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