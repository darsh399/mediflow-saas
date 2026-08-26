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
    <div className="container-fluid py-4">
      <div className="mb-4">
        <span className="text-primary fw-semibold small">LEAVE MANAGEMENT</span>
        <h2 className="fw-bold mb-1 mt-1">Leave Requests</h2>
        <p className="text-muted mb-0">Review and action pending leave requests from your team.</p>
      </div>

      {loading && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted mb-0">Loading leaves...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error.message || JSON.stringify(error)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "70px", height: "70px", fontSize: "28px" }}>
              <i className="bi bi-calendar2-check"></i>
            </div>
            <h5 className="fw-bold mb-1">No leave requests</h5>
            <p className="text-muted mb-0">There are currently no leave requests to review.</p>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="list-group list-group-flush">
            {items.map(l => (
              <div key={l._id} className="list-group-item p-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">
                    {l.userId?.name || l.userId}
                    <span className="badge bg-primary-subtle text-primary rounded-pill ms-2">{l.type}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                  </div>
                  {l.reason && <div className="text-muted small mt-1">{l.reason}</div>}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success rounded-3" onClick={()=>handleReview(l._id, 'approve')}>
                    <i className="bi bi-check-lg me-1"></i>
                    Approve
                  </button>
                  <button className="btn btn-sm btn-outline-danger rounded-3" onClick={()=>handleReview(l._id, 'reject')}>
                    <i className="bi bi-x-lg me-1"></i>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaves
