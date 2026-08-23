import { useEffect, useState } from 'react'
import employeeProfileApi from '../../api/employeeProfileApi'

const documentTypes = ['aadhar', 'pan', 'addressProof', 'tenth', 'twelfth', 'degree', 'passportPhoto']
const experiencedDocuments = ['offerLetter', 'relievingLetter', 'salarySlips']

const EmployeeOnboarding = () => {
  const [profile, setProfile] = useState(null)
  const [profileData, setProfileData] = useState({ fullName: '', dob: '', mobile: '', bloodGroup: '', emergencyContact: '', currentAddress: '', permanentAddress: '' })
  const [experienceType, setExperienceType] = useState('fresher')
  const [files, setFiles] = useState({})
  const [experienceFiles, setExperienceFiles] = useState({});
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    employeeProfileApi.getMyProfile().then(response => {
      if (response.profile) {
        setProfile(response.profile)
        setProfileData(data => ({ ...data, ...(response.profile.profileData || {}) }))
        setExperienceType(response.profile.experienceType || 'fresher')
      }
    }).catch(err => setError(err?.response?.data?.message || 'Unable to load profile'))
  }, [])

  const updateField = event => setProfileData(data => ({ ...data, [event.target.name]: event.target.value }))
  const saveDraft = async () => {
    setSaving(true); setError('')
    try {
      const response = await employeeProfileApi.saveProfile({ profileData, experienceType })
      setProfile(response.profile); setMessage('Draft saved')
    } catch (err) { setError(err?.response?.data?.message || 'Unable to save draft') }
    setSaving(false)
  }
 const uploadFiles = async () => {
  const normalEntries = Object.entries(files).filter(([, file]) => file)

  const experienceEntries =
    experienceType === 'experienced'
      ? Object.entries(experienceFiles).filter(([, file]) => file)
      : []

  if (!normalEntries.length && !experienceEntries.length) return

  const formData = new FormData()

  // Normal documents
  normalEntries.forEach(([type, file]) => {
    if (type === 'passportPhoto') {
      formData.append('profileImage', file)
    } else {
      formData.append('documents', file)
      formData.append('documentType', type)
    }
  })

  // Experience documents
  experienceEntries.forEach(([type, file]) => {
    formData.append('documents', file)
    formData.append('documentType', type)
  })

  await employeeProfileApi.uploadDocuments(formData)
}
  const submit = async event => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      await employeeProfileApi.saveProfile({ profileData, experienceType })
      await uploadFiles()
      const response = await employeeProfileApi.submitProfile()
      setProfile(response.profile); setMessage('Profile submitted for review')
    } catch (err) { setError(err?.response?.data?.message || 'Unable to submit profile') }
    setSaving(false)
  }

  const locked = ['SUBMITTED', 'APPROVED'].includes(profile?.status)
  return <div>
    <h2>Employee Profile Onboarding</h2>
    {message && <div className="alert alert-success">{message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}
    {profile?.status && <div className="alert alert-info">Status: {profile.status}</div>}
    <form onSubmit={submit}>
      <div className="row">
        {Object.entries(profileData).map(([name, value]) => <div className="col-md-6 mb-3" key={name}>
          <label className="form-label">{name.replace(/[A-Z]/g, match => ` ${match}`).replace(/^./, match => match.toUpperCase())}</label>
          {name.includes('Address') || name === 'emergencyContact' ? <textarea className="form-control" name={name} value={value} onChange={updateField} required={!locked} /> : <input className="form-control" name={name} type={name === 'dob' ? 'date' : 'text'} value={value} onChange={updateField} required={!locked} />}
        </div>)}
      </div>
      <div className="mb-3"><label className="form-label">Experience</label><select className="form-select" value={experienceType} onChange={event => setExperienceType(event.target.value)} disabled={locked}><option value="fresher">Fresher</option><option value="experienced">Experienced</option></select></div>
       {experienceType === 'experienced' && (
  <div className="row">
    {experiencedDocuments.map((type) => (
      <div className="col-md-6 mb-3" key={type}>
        <label className="form-label">{type}</label>

        <input
          className="form-control"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={locked}
          onChange={(event) =>
            setExperienceFiles((current) => ({
              ...current,
              [type]: event.target.files[0]
            }))
          }
        />
      </div>
    ))}
  </div>
)}
      <div className="row">
        {documentTypes.map(type => <div className="col-md-6 mb-3" key={type}><label className="form-label">{type}</label><input className="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={locked} onChange={event => setFiles(current => ({ ...current, [type]: event.target.files[0] }))} /></div>)}
      </div>
      {!locked && <div><button type="button" className="btn btn-outline-secondary me-2" onClick={saveDraft} disabled={saving}>Save draft</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Submit for review'}</button></div>}
    </form>
  </div>
}

export default EmployeeOnboarding
