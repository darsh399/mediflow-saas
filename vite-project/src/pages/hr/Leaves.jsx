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

      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
          style={{ width: '52px', height: '52px' }}
        >
          <i className="bi bi-calendar2-week-fill fs-4"></i>
        </div>
        <div>
          <h2 className="fw-bold mb-0">Leave Requests</h2>
          <p className="text-muted mb-0">Review and act on leave requests.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3"></div>
            <div className="text-muted">Loading leaves...</div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger border-0 rounded-3 m-4 mb-0">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error.message || JSON.stringify(error)}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x text-muted fs-1"></i>
            <h6 className="fw-bold mt-3">No leave requests</h6>
            <p className="text-muted mb-0">There are no leave requests to review right now.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="list-group list-group-flush">
            {items.map(l => (
              <div key={l._id} className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-3 p-4">
                <div>
                  <div className="fw-semibold">{l.userId?.name || l.userId} — <span className="text-capitalize">{l.type}</span></div>
                  <div className="text-muted small">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</div>
                  {l.reason && <div className="text-muted small mt-1">{l.reason}</div>}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm rounded-3" onClick={()=>handleReview(l._id, 'approve')}>
                    <i className="bi bi-check-lg me-1"></i>
                    Approve
                  </button>
                  <button className="btn btn-outline-danger btn-sm rounded-3" onClick={()=>handleReview(l._id, 'reject')}>
                    <i className="bi bi-x-lg me-1"></i>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default Leaves
