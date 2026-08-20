import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaves, reviewLeave } from '../../redux/slices/leaveSlice'

const Leaves = ()=>{
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.leaves)

  useEffect(()=>{ dispatch(fetchLeaves()) }, [dispatch])

  const handleReview = (id, action)=>{
    if(!confirm(`Mark as ${action}?`)) return
    dispatch(reviewLeave({ id, action }))
  }

  return (
    <div>
      <h2>Leave Requests</h2>
      {loading && <div className="alert alert-info">Loading leaves...</div>}
      {error && <div className="alert alert-danger">{error.message||JSON.stringify(error)}</div>}
      {!loading && items.length === 0 && <div className="alert alert-warning">No leave requests.</div>}

      <div className="list-group">
        {items.map(l => (
          <div key={l._id} className="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <div><strong>{l.userId?.name || l.userId}</strong> — {l.type} ({new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()})</div>
              <div className="text-muted">{l.reason}</div>
            </div>
            <div>
              <button className="btn btn-sm btn-success me-2" onClick={()=>handleReview(l._id, 'approve')}>Approve</button>
              <button className="btn btn-sm btn-danger" onClick={()=>handleReview(l._id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Leaves
