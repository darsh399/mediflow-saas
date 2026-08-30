import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaves, reviewLeave } from '../../redux/slices/leaveSlice'
import { PageContainer, PageHeader, EmptyState, SkeletonTable } from '../../components/ui'

const Leaves = ()=>{
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.leaves)

  useEffect(()=>{ dispatch(fetchLeaves()) }, [dispatch])

  const handleReview = (id, action)=>{
    if(!confirm(`Mark as ${action}?`)) return
    dispatch(reviewLeave({ id, action }))
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Leave" title="Leave Requests" description="Review and action pending leave requests from your team." />

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error.message || 'Unable to load leaves.'}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} columns={3} />
      ) : items.length === 0 ? (
        <EmptyState icon="bi-calendar2-check" title="No leave requests" description="There are currently no leave requests to review." />
      ) : (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="list-group list-group-flush">
            {items.map(l => (
              <div key={l._id} className="list-group-item p-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">
                    {l.userId?.name || l.userId}
                    <span className="mf-badge mf-badge--primary ms-2">{l.type}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                  </div>
                  {l.reason && <div className="text-muted small mt-1">{l.reason}</div>}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success rounded-3" onClick={()=>handleReview(l._id, 'approve')}>
                    <i className="bi bi-check-lg me-1"></i> Approve
                  </button>
                  <button className="btn btn-sm btn-outline-danger rounded-3" onClick={()=>handleReview(l._id, 'reject')}>
                    <i className="bi bi-x-lg me-1"></i> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Leaves
