import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import userApi from '../../api/userApi'
import { Link, useNavigate } from 'react-router-dom'

const Profile = ()=>{
  const auth = useSelector(s => s.auth)
  const user = auth?.user
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
 console.log(user, 'in profile user')
  useEffect(()=>{
    const fetch = async ()=>{
      if(!user?.id && !user?._id) return
      setLoading(true)
      try{
        const id = user.id || user._id
        const data = await userApi.fetchUser(id)
        setProfile(data.user || data)
      }catch(err){}
      setLoading(false)
    }
    fetch()
  }, [user])

  if(!user) return <div className="container my-5"><div className="alert alert-warning">Not signed in. <Link to="/login">Login</Link></div></div>
  if(loading) return <div className="container my-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>
  if(!profile) return <div className="container my-5"><div className="alert alert-info">No profile data.</div></div>

  const p = profile.profile || {}
  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>My Profile</h1>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={()=>nav('/profile/edit')}>Edit Profile</button>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-3">
            <h5 className="card-title">{profile.name}</h5>
            <p className="mb-1"><strong>Email:</strong> {profile.email}</p>
            <p className="mb-1"><strong>Mobile:</strong> {profile.mobile}</p>
            <p className="mb-1"><strong>Role:</strong> {profile.role}</p>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-3">
            <h5>Details</h5>
            <dl className="row">
              <dt className="col-sm-3">Father Name</dt>
              <dd className="col-sm-9">{p.fatherName || '-'}</dd>

              <dt className="col-sm-3">DOB</dt>
              <dd className="col-sm-9">{p.dob ? new Date(p.dob).toLocaleDateString() : '-'}</dd>

              <dt className="col-sm-3">Gender</dt>
              <dd className="col-sm-9">{p.gender || '-'}</dd>

              <dt className="col-sm-3">Emergency Contact</dt>
              <dd className="col-sm-9">{p.emergencyContact?.name ? `${p.emergencyContact.name} (${p.emergencyContact.phone})` : '-'}</dd>

              <dt className="col-sm-3">Address</dt>
              <dd className="col-sm-9">{p.currentAddress?.line1 ? `${p.currentAddress.line1}, ${p.currentAddress.city || ''}` : '-'}</dd>

              <dt className="col-sm-3">Job</dt>
              <dd className="col-sm-9">{p.jobDetails?.designation || '-'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
