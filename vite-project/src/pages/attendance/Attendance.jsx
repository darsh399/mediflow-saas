import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import attendanceApi from '../../api/attendanceApi'
import { PageContainer, PageHeader, StatCard, Badge, EmptyState, AppModal } from '../../components/ui'

const REVIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'hr']
const CORRECTION_BADGE = { PENDING: 'text-bg-warning', APPROVED: 'text-bg-success', REJECTED: 'text-bg-danger' }

// Date -> value a datetime-local input expects (YYYY-MM-DDTHH:mm, local time).
function toLocalInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
}

function formatDuration(hours) {
  const totalMinutes = Math.max(0, Math.round(Number(hours || 0) * 60))
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}

function getInitials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || '?'
}

function locationFromBrowser() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(undefined)
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  })
}

function requestMessage(requestError, fallback) {
  if (requestError.response?.data?.message) return requestError.response.data.message
  if (requestError.response?.status) return `${fallback} (${requestError.response.status})`
  if (requestError.request) return 'Cannot reach the attendance server. Check that the backend is running.'
  return requestError.message || fallback
}

export default function Attendance() {
  const role = useSelector((state) => state.auth.user?.role)
  const navigate = useNavigate()
  const isReviewer = REVIEWER_ROLES.includes(role)
  const [today, setToday] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [correctionRecord, setCorrectionRecord] = useState(null)
  const [correctionForm, setCorrectionForm] = useState({ checkIn: '', checkOut: '', reason: '' })
  const [correctionBusy, setCorrectionBusy] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const monthFilter = month || year ? { month: month || undefined, year: year || undefined, limit: 200 } : {}
      if (isReviewer) {
        const history = await attendanceApi.listAttendance({ limit: 100, ...monthFilter })
        setRecords(history.attendance || [])
      } else {
        const [current, history] = await Promise.all([attendanceApi.getToday(), attendanceApi.listAttendance({ limit: 10, ...monthFilter })])
        setToday(current.attendance)
        setRecords(history.attendance || [])
      }
      setError('')
    } catch (requestError) {
      setError(requestMessage(requestError, 'Unable to load attendance'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isReviewer, month, year])

  const clearMonthFilter = () => { setMonth(''); setYear('') }

  function openCorrection(record) {
    const recordSessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut }] : []
    setCorrectionForm({
      checkIn: toLocalInput(recordSessions[0]?.checkIn),
      checkOut: toLocalInput(recordSessions[recordSessions.length - 1]?.checkOut),
      reason: '',
    })
    setCorrectionRecord(record)
  }

  async function submitCorrection(event) {
    event.preventDefault()
    if (!correctionRecord) return
    try {
      setCorrectionBusy(true)
      setError('')
      await attendanceApi.requestCorrection(correctionRecord._id, {
        checkIn: correctionForm.checkIn ? new Date(correctionForm.checkIn).toISOString() : undefined,
        checkOut: correctionForm.checkOut ? new Date(correctionForm.checkOut).toISOString() : undefined,
        reason: correctionForm.reason.trim(),
      })
      setCorrectionRecord(null)
      await load()
    } catch (requestError) {
      setError(requestMessage(requestError, 'Unable to submit correction request'))
    } finally {
      setCorrectionBusy(false)
    }
  }

  const monthYearFilter = (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-3">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <i className="bi bi-funnel text-muted"></i>
          <select className="form-select" style={{ maxWidth: 180 }} value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option value={index + 1} key={index}>{new Date(2000, index, 1).toLocaleString('en-IN', { month: 'long' })}</option>
            ))}
          </select>
          <input className="form-control" style={{ maxWidth: 140 }} type="number" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
          {(month || year) && (
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={clearMonthFilter}>
              <i className="bi bi-x-lg me-1"></i>Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )

  function viewEmployeeHistory(employeeId) {
    if (employeeId) navigate(`/attendance/${employeeId}`)
  }

  async function runAction(action) {
    try {
      setActionLoading(true)
      setError('')
      const location = await locationFromBrowser()
      const result = action === 'checkIn'
        ? await attendanceApi.checkIn(location, navigator.platform)
        : action === 'checkOut'
          ? await attendanceApi.checkOut(location)
          : await attendanceApi.toggleBreak()
      setToday(result.attendance)
      try {
        await load()
      } catch (refreshError) {
        setError(requestMessage(refreshError, 'Attendance saved, but history could not be refreshed'))
      }
    } catch (requestError) {
      setError(requestMessage(requestError, 'Attendance action failed'))
    } finally {
      setActionLoading(false)
    }
  }

  const sessions = today?.sessions?.length ? today.sessions : today?.checkIn ? [{ checkIn: today.checkIn, checkOut: today.checkOut, breaks: today.breaks || [] }] : []
  const activeSession = sessions.find((session) => !session.checkOut)
  const activeBreak = activeSession?.breaks?.some((item) => !item.endedAt)
  const checkedIn = Boolean(activeSession)

  if (isReviewer) {
    return (

      <PageContainer>
        <PageHeader
          eyebrow="WORKFORCE"
          title="Attendance Management"
          description="Review attendance records for everyone in your company."
          actions={
            <button type="button" className="btn btn-outline-primary rounded-3" onClick={load} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
          }
        />

        {error && (
          <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        {monthYearFilter}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted mb-0">Loading company attendance...</p>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">Recent attendance</h5>
              <p className="text-muted small mb-0">{records.length} record{records.length === 1 ? '' : 's'}</p>
            </div>
            {!records.length ? (
              <div className="card-body">
                <EmptyState icon="bi-calendar-x" title="No attendance records yet" description="Records will appear here once employees start checking in." />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-3 px-4 text-muted small text-uppercase">Employee</th>
                      <th className="py-3 text-muted small text-uppercase">Role</th>
                      <th className="py-3 text-muted small text-uppercase">Date</th>
                      <th className="py-3 text-muted small text-uppercase">Status</th>
                      <th className="py-3 text-muted small text-uppercase">Check-in</th>
                      <th className="py-3 text-muted small text-uppercase">Check-out</th>
                      <th className="py-3 text-muted small text-uppercase">Total hours</th>
                      <th className="py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const employee = record.employeeId || {}
                      const recordSessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut }] : []
                      const firstSession = recordSessions[0]
                      const lastSession = recordSessions[recordSessions.length - 1]
                      return (
                        <tr
                          key={record._id}
                          role="button"
                          tabIndex="0"
                          style={{ cursor: 'pointer' }}
                          onClick={() => viewEmployeeHistory(employee._id)}
                          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') viewEmployeeHistory(employee._id) }}
                        >
                          <td className="py-3 px-4">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                style={{ width: '40px', height: '40px', background: 'var(--mf-color-primary-subtle)', color: 'var(--mf-color-primary)' }}
                              >
                                {getInitials(employee.name)}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  className="btn btn-link p-0 fw-semibold text-start text-decoration-none"
                                  onClick={(event) => { event.stopPropagation(); viewEmployeeHistory(employee._id) }}
                                >
                                  {employee.name || 'Unknown employee'}
                                </button>
                                <div className="small text-muted">{employee.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-capitalize">{String(employee.role || '-').replace(/_/g, ' ')}</td>
                          <td className="py-3">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="py-3"><Badge status={record.status} /></td>
                          <td className="py-3">{formatTime(firstSession?.checkIn)}</td>
                          <td className="py-3">{formatTime(lastSession?.checkOut)}</td>
                          <td className="py-3">{formatDuration(record.totalWorkingHours)}</td>
                          <td className="py-3 text-end pe-4">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-3"
                              onClick={(event) => { event.stopPropagation(); viewEmployeeHistory(employee._id) }}
                            >
                              View full history
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="WORKFORCE"
        title="Attendance"
        description="Track today's work time and attendance history."
        actions={
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary rounded-3 fw-semibold" disabled={actionLoading || checkedIn} onClick={() => runAction('checkIn')}>
              <i className="bi bi-box-arrow-in-right me-1"></i>Check in
            </button>
            <button className="btn btn-outline-primary rounded-3" disabled={actionLoading || !checkedIn} onClick={() => runAction('checkOut')}>
              <i className="bi bi-box-arrow-right me-1"></i>Check out
            </button>
            <button className="btn btn-outline-secondary rounded-3" disabled={actionLoading || !checkedIn} onClick={() => runAction('break')}>
              <i className={`bi ${activeBreak ? 'bi-play-fill' : 'bi-pause-fill'} me-1`}></i>{activeBreak ? 'End break' : 'Start break'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted mb-0">Loading attendance...</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <StatCard icon="bi-person-check" label="STATUS" value={today?.status || 'Not started'} />
            </div>
            <div className="col-sm-6 col-lg-3">
              <StatCard icon="bi-clock-history" label="CURRENT SESSION" value={formatTime(activeSession?.checkIn)} />
            </div>
            <div className="col-sm-6 col-lg-3">
              <StatCard icon="bi-list-check" label="SESSIONS TODAY" value={sessions.length} />
            </div>
            <div className="col-sm-6 col-lg-3">
              <StatCard icon="bi-hourglass-split" label="WORKING HOURS" value={formatDuration(today?.totalWorkingHours)} />
            </div>
          </div>

          {monthYearFilter}

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">Recent attendance</h5>
              <p className="text-muted small mb-0">{records.length} record{records.length === 1 ? '' : 's'}</p>
            </div>
            {!records.length ? (
              <div className="card-body">
                <EmptyState icon="bi-calendar-x" title="No attendance records yet" description="Check in to start building your attendance history." />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-3 px-4 text-muted small text-uppercase">Date</th>
                      <th className="py-3 text-muted small text-uppercase">Status</th>
                      <th className="py-3 text-muted small text-uppercase">Sessions</th>
                      <th className="py-3 text-muted small text-uppercase">Total hours</th>
                      <th className="py-3 text-muted small text-uppercase">Regularization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const recordSessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut }] : []
                      const correctionStatus = record.correction?.status
                      return (
                        <tr key={record._id}>
                          <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="py-3"><Badge status={record.status} /></td>
                          <td className="py-3">{recordSessions.map((session) => `${formatTime(session.checkIn)} - ${formatTime(session.checkOut)}`).join(', ') || '-'}</td>
                          <td className="py-3">{formatDuration(record.totalWorkingHours)}</td>
                          <td className="py-3">
                            {correctionStatus === 'PENDING' || correctionStatus === 'APPROVED' ? (
                              <span className={`badge ${CORRECTION_BADGE[correctionStatus]}`}>Correction {correctionStatus.toLowerCase()}</span>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                {correctionStatus === 'REJECTED' && <span className="badge text-bg-danger">Rejected</span>}
                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => openCorrection(record)}>
                                  <i className="bi bi-pencil-square me-1"></i>Request fix
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {correctionRecord && (
        <AppModal
          title="Request attendance correction"
          subtitle={new Date(correctionRecord.date).toLocaleDateString()}
          onClose={() => (correctionBusy ? null : setCorrectionRecord(null))}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary rounded-3" disabled={correctionBusy} onClick={() => setCorrectionRecord(null)}>Cancel</button>
              <button type="submit" form="attendance-correction-form" className="btn btn-primary rounded-3" disabled={correctionBusy}>
                {correctionBusy ? 'Submitting…' : 'Submit request'}
              </button>
            </>
          }
        >
          <form id="attendance-correction-form" onSubmit={submitCorrection}>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="correction-check-in">Corrected check-in</label>
                <input id="correction-check-in" type="datetime-local" className="form-control" value={correctionForm.checkIn} onChange={(event) => setCorrectionForm((form) => ({ ...form, checkIn: event.target.value }))} />
              </div>
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="correction-check-out">Corrected check-out</label>
                <input id="correction-check-out" type="datetime-local" className="form-control" value={correctionForm.checkOut} onChange={(event) => setCorrectionForm((form) => ({ ...form, checkOut: event.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="correction-reason">Reason</label>
                <textarea id="correction-reason" className="form-control" rows={3} required value={correctionForm.reason} onChange={(event) => setCorrectionForm((form) => ({ ...form, reason: event.target.value }))} placeholder="Explain why this record needs correcting" />
              </div>
            </div>
            <p className="text-muted small mb-0 mt-3">Leave a time unchanged to keep it as recorded. A reviewer must approve before the record updates.</p>
          </form>
        </AppModal>
      )}
    </PageContainer>
  )
}
