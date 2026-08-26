import { useEffect, useState } from 'react'
import userApi from '../api/userApi'
import visitApi from '../api/visitApi'

// Nested-in-page dialog for scheduling a doctor/medical visit for an
// employee, used from both the Doctors list (quick action) and Doctor
// Details (assign button) instead of a dedicated full page.
const AssignVisitModal = ({ doctorId, medicalId, targetName, onClose, onAssigned }) => {
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let active = true
    userApi.listColleagues()
      .then((data) => {
        if (!active) return
        const roleOrder = ['mr', 'employee']
        const list = (data.users || []).filter((u) => !['admin', 'company_owner', 'super_admin', 'superadmin', 'hr_manager', 'hr'].includes(u.role))
        list.sort((a, b) => (roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)) || a.name.localeCompare(b.name))
        setEmployees(list)
      })
      .catch(() => setError('Unable to load employees'))
      .finally(() => active && setEmployeesLoading(false))
    return () => { active = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employeeId) return setError('Please select an employee')
    if (!visitDate) return setError('Please pick a visit date')

    try {
      setSubmitting(true)
      setError('')
      await visitApi.assignVisit({
        employeeId,
        doctorId: doctorId || undefined,
        medicalId: medicalId || undefined,
        visitDate,
        purpose: purpose.trim(),
        notes: notes.trim(),
      })
      onAssigned?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to assign visit')
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
              <h5 className="modal-title fw-bold mb-0">Assign Visit</h5>
              <p className="text-muted small mb-0">Schedule a visit to {targetName} for an employee.</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="mb-3">
                <label className="form-label fw-semibold">Employee</label>
                <select
                  className="form-select"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={employeesLoading}
                  required
                >
                  <option value="">{employeesLoading ? 'Loading employees...' : 'Select employee'}</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Visit Date</label>
                <input
                  type="date"
                  className="form-control"
                  min={today}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Purpose <span className="text-muted fw-normal">(optional)</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. product detailing, follow-up"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="mb-0">
                <label className="form-label fw-semibold">Notes <span className="text-muted fw-normal">(optional)</span></label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light border rounded-3 px-4" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Assign Visit
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

export default AssignVisitModal
