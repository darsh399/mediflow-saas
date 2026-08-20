import { useEffect, useState } from 'react'
import employeeProfileApi from '../../api/employeeProfileApi'

const ProfileReviews = () => {
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')
  const load = () => employeeProfileApi.listProfiles().then(response => setProfiles(response.profiles || [])).catch(err => setError(err?.response?.data?.message || 'Unable to load profiles'))
  useEffect(() => { load() }, [])
  const review = async (id, status) => {
    const rejectionReason = status === 'REJECTED' ? window.prompt('Reason for rejection') : undefined
    if (status === 'REJECTED' && !rejectionReason) return
    try { await employeeProfileApi.reviewProfile(id, { status, rejectionReason }); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to review profile') }
  }
  const download = async url => {
    try {
      const blob = await employeeProfileApi.downloadDocument(url)
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = url.split('/').pop(); link.click(); URL.revokeObjectURL(link.href)
    } catch (err) { setError(err?.response?.data?.message || 'Unable to download document') }
  }
  return <div><h2>Employee Profile Reviews</h2>{error && <div className="alert alert-danger">{error}</div>}{!profiles.length && <div className="alert alert-info">No employee profiles submitted.</div>}<div className="table-responsive"><table className="table"><thead><tr><th>Employee</th><th>Role</th><th>Status</th><th>Documents</th><th>Actions</th></tr></thead><tbody>{profiles.map(profile => <tr key={profile._id}><td>{profile.userId?.name}<div className="small text-muted">{profile.userId?.email}</div></td><td>{profile.userId?.role}</td><td>{profile.status}{profile.rejectionReason && <div className="small text-danger">{profile.rejectionReason}</div>}</td><td>{(profile.documents || []).map(document => <button type="button" className="btn btn-sm btn-link d-block" key={document.url} onClick={() => download(document.url)}>{document.originalName || document.type}</button>)}</td><td>{profile.status === 'SUBMITTED' && <><button type="button" className="btn btn-sm btn-success me-2" onClick={() => review(profile._id, 'APPROVED')}>Approve</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => review(profile._id, 'REJECTED')}>Reject</button></>}</td></tr>)}</tbody></table></div></div>
}
export default ProfileReviews
