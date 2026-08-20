import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser, changeUserStatus } from '../../redux/slices/userSlice'
import { useParams } from 'react-router-dom'

const UserDetails = ()=>{
  const { id } = useParams()
  const dispatch = useDispatch()
  const { current, loading, error } = useSelector(s => s.users)

  useEffect(()=>{ if(id) dispatch(fetchUser(id)) }, [dispatch, id])

  const handleStatus = (action)=>{
    if(!confirm(`Perform ${action}?`)) return
    dispatch(changeUserStatus({ id, action }))
  }

  if(loading) return <div className="alert alert-info">Loading...</div>
  if(error) return <div className="alert alert-danger">{error.message||JSON.stringify(error)}</div>
  if(!current) return <div className="alert alert-warning">User not found</div>

  return (
    <div>
      <h2>{current.name}</h2>
      <p><strong>Email:</strong> {current.email}</p>
      <p><strong>Role:</strong> {current.role}</p>
      <p><strong>Active:</strong> {String(current.active)}</p>
      <p><strong>Blocked:</strong> {String(current.blocked)}</p>

      <div className="d-flex gap-2">
        <button className="btn btn-warning" onClick={()=>handleStatus('disable')}>Disable</button>
        <button className="btn btn-success" onClick={()=>handleStatus('enable')}>Enable</button>
        <button className="btn btn-danger" onClick={()=>handleStatus('block')}>Block</button>
        <button className="btn btn-secondary" onClick={()=>handleStatus('unblock')}>Unblock</button>
      </div>
    </div>
  )
}

export default UserDetails
