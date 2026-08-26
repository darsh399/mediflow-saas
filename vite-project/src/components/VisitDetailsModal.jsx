// Nested-in-page dialog showing everything about one visit — who assigned
// it, the doctor/medical target, date, purpose/notes, and status. Reschedule/
// Cancel/Mark Complete only apply to visits an admin/hr_manager/manager
// actually assigned (visit.assignedBy set) — not to self-logged doctor/
// medical check-ins, which are already completed the moment they're created.
const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const VisitDetailsModal = ({ visit, onClose, onReschedule, onCancel, onComplete }) => {
  if (!visit) return null

  const isAssignedTask = Boolean(visit.assignedBy)
  const canAct = isAssignedTask && visit.status === 'scheduled'

  const target = visit.doctorId
    ? { type: 'Doctor', name: visit.doctorId.name, extra: visit.doctorId.specialty || visit.doctorId.phone }
    : visit.medicalId
      ? { type: 'Medical', name: visit.medicalId.name, extra: visit.medicalId.phone }
      : { type: 'Visit', name: '-', extra: '' }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 border-0">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold mb-0">Visit Details</h5>
              <p className="text-muted small mb-0">{target.type}: {target.name}</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="row g-3 mb-2">
              <div className="col-6">
                <small className="text-muted d-block">Visit Date</small>
                <div className="fw-semibold">{formatDateTime(visit.visitedAt)}</div>
              </div>
              <div className="col-6">
                <small className="text-muted d-block">Status</small>
                <div className="fw-semibold text-capitalize">{(visit.status || '-').replace(/_/g, ' ')}</div>
              </div>
            </div>

            <div className="mb-2">
              <small className="text-muted d-block">Assigned By</small>
              <div className="fw-semibold">
                {visit.assignedBy?.name ? `${visit.assignedBy.name} (${visit.assignedBy.role})` : 'Self-logged'}
              </div>
            </div>

            {visit.completedAt && (
              <div className="mb-2">
                <small className="text-muted d-block">Completed On</small>
                <div className="fw-semibold">{formatDateTime(visit.completedAt)}</div>
              </div>
            )}

            {target.extra && (
              <div className="mb-2">
                <small className="text-muted d-block">{target.type} Details</small>
                <div className="fw-semibold">{target.extra}</div>
              </div>
            )}

            {visit.purpose && (
              <div className="mb-2">
                <small className="text-muted d-block">Purpose</small>
                <div>{visit.purpose}</div>
              </div>
            )}

            {visit.notes && (
              <div className="mb-2">
                <small className="text-muted d-block">Notes</small>
                <div>{visit.notes}</div>
              </div>
            )}

            {visit.rescheduleReason && (
              <div className="mb-2">
                <small className="text-muted d-block">Reschedule Reason</small>
                <div>{visit.rescheduleReason}</div>
              </div>
            )}

            {visit.cancellationReason && (
              <div className="mb-2">
                <small className="text-muted d-block">Cancellation Reason</small>
                <div>{visit.cancellationReason}</div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light border rounded-3 px-4" onClick={onClose}>
              Close
            </button>
            {canAct && (
              <>
                <button type="button" className="btn btn-outline-danger rounded-3 px-4" onClick={() => onCancel(visit)}>
                  <i className="bi bi-x-lg me-2"></i>
                  Cancel
                </button>
                <button type="button" className="btn btn-outline-primary rounded-3 px-4" onClick={() => onReschedule(visit)}>
                  <i className="bi bi-calendar-event me-2"></i>
                  Reschedule
                </button>
                <button type="button" className="btn btn-success rounded-3 px-4 fw-semibold" onClick={() => onComplete(visit)}>
                  <i className="bi bi-check-lg me-2"></i>
                  Mark Complete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisitDetailsModal
