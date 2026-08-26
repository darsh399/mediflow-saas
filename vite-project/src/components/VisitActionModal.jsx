import { useState } from 'react'
import visitApi from '../api/visitApi'

const MODE_META = {
  reschedule: { title: 'Reschedule Visit', submitLabel: 'Reschedule', submitClass: 'btn-primary', icon: 'bi-calendar-check' },
  cancel: { title: 'Cancel Visit', submitLabel: 'Cancel Visit', submitClass: 'btn-danger', icon: 'bi-x-circle' },
  complete: { title: 'Mark Visit Complete', submitLabel: 'Mark Complete', submitClass: 'btn-success', icon: 'bi-check-circle' },
}

// Nested-in-page dialog letting the assigned employee reschedule (new date +
// reason), cancel (reason only), or mark done (optional notes) one of their
// own assigned visits.
const VisitActionModal = ({ visit, mode, onClose, onDone }) => {
  const today = new Date().toISOString().slice(0, 10)
  const [visitDate, setVisitDate] = useState(visit?.visitedAt ? new Date(visit.visitedAt).toISOString().slice(0, 10) : today)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const meta = MODE_META[mode] || MODE_META.reschedule
  const isReschedule = mode === 'reschedule'
  const isCancel = mode === 'cancel'
  const isComplete = mode === 'complete'
  const reasonRequired = isReschedule || isCancel

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (reasonRequired && !reason.trim()) return setError('Please provide a reason')
    if (isReschedule && !visitDate) return setError('Please pick a new date')

    try {
      setSubmitting(true)
      setError('')
      if (isReschedule) {
        await visitApi.rescheduleVisit(visit._id, { visitDate, reason: reason.trim() })
      } else if (isCancel) {
        await visitApi.cancelVisit(visit._id, { reason: reason.trim() })
      } else {
        await visitApi.completeVisit(visit._id, { notes: reason.trim() })
      }
      onDone?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || `Unable to ${mode} visit`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 border-0">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold mb-0">{meta.title}</h5>
              <p className="text-muted small mb-0">
                {visit?.doctorId?.name || visit?.medicalId?.name || 'This visit'}
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              {isReschedule && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">New Visit Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={today}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="mb-0">
                <label className="form-label fw-semibold">
                  {isComplete ? 'Notes' : `Reason for ${isReschedule ? 'rescheduling' : 'cancelling'}`}
                  {isComplete && <span className="text-muted fw-normal"> (optional)</span>}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isComplete ? 'Anything worth noting about this visit...' : 'Explain why...'}
                  required={reasonRequired}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light border rounded-3 px-4" onClick={onClose} disabled={submitting}>
                Close
              </button>
              <button
                type="submit"
                className={`btn rounded-3 px-4 fw-semibold ${meta.submitClass}`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className={`bi ${meta.icon} me-2`}></i>
                    {meta.submitLabel}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VisitActionModal
