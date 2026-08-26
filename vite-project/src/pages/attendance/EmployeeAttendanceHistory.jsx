import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import attendanceApi from '../../api/attendanceApi'

const REVIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'hr']

const RANGE_OPTIONS = [
  ['LAST_7_DAYS', 'Last 7 days'],
  ['THIS_MONTH', 'This month'],
  ['LAST_MONTH', 'Last month'],
  ['LAST_3_MONTHS', 'Last 3 months'],
  ['CUSTOM', 'Custom range'],
]

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : '-'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
}

function formatDuration(hours) {
  const totalMinutes = Math.max(0, Math.round(Number(hours || 0) * 60))
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}

function requestMessage(requestError, fallback) {
  if (requestError.response?.data?.message) return requestError.response.data.message
  if (requestError.response?.status) return `${fallback} (${requestError.response.status})`
  if (requestError.request) return 'Cannot reach the attendance server. Check that the backend is running.'
  return requestError.message || fallback
}

export default function EmployeeAttendanceHistory() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const role = useSelector((state) => state.auth.user?.role)
  const isReviewer = REVIEWER_ROLES.includes(role)

  const [range, setRange] = useState('LAST_7_DAYS')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [page, setPage] = useState(1)
  const [employee, setEmployee] = useState(null)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [dateRange, setDateRange] = useState({})
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (range === 'CUSTOM' && (!customStart || !customEnd)) return
    if (range === 'CUSTOM' && customStart > customEnd) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const params = range === 'CUSTOM' ? { startDate: customStart, endDate: customEnd, page, limit: 100 } : { range, page, limit: 100 }
        const response = await attendanceApi.getEmployeeAttendance(employeeId, params)
        if (cancelled) return
        setEmployee(response.employee || null)
        setRecords(response.attendance || [])
        setSummary(response.summary || null)
        setDateRange(response.dateRange || {})
        setPagination(response.pagination || {})
        setError('')
      } catch (requestError) {
        if (!cancelled) setError(requestMessage(requestError, 'Unable to load attendance history'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [employeeId, range, customStart, customEnd, page])

  const changeRange = (value) => { setRange(value); setPage(1) }
  const customError = range === 'CUSTOM' && customStart && customEnd && customStart > customEnd ? 'From date cannot be after To date' : ''
  const total = pagination.total || 0
  const totalPages = pagination.pages || 0

  if (!isReviewer) {
    return <div className="container-fluid py-4"><div className="alert alert-danger">You do not have permission to view this page.</div></div>
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="text-primary fw-semibold small">WORKFORCE</span>
          <h2 className="fw-bold mb-1 mt-1">Employee Attendance History</h2>
          <p className="text-muted mb-0">Full attendance record for one employee by date range.</p>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/attendance')}><i className="bi bi-arrow-left me-1" />Attendance list</button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {employee && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-1">{employee.name || 'Unknown employee'}</h5>
            <div className="text-muted">{employee.employeeId || 'No employee ID'} · {employee.email || 'No email'} · <span className="text-capitalize">{String(employee.role || '-').replace(/_/g, ' ')}</span></div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold" htmlFor="attendance-history-range">Date range</label>
              <select id="attendance-history-range" className="form-select" value={range} onChange={(event) => changeRange(event.target.value)}>
                {RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {range === 'CUSTOM' && <>
              <div className="col-md-3">
                <label className="form-label fw-semibold" htmlFor="attendance-history-start">From</label>
                <input id="attendance-history-start" type="date" className="form-control" value={customStart} onChange={(event) => { setCustomStart(event.target.value); setPage(1) }} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" htmlFor="attendance-history-end">To</label>
                <input id="attendance-history-end" type="date" className="form-control" value={customEnd} onChange={(event) => { setCustomEnd(event.target.value); setPage(1) }} />
              </div>
            </>}
          </div>
          {customError && <div className="text-danger small mt-2">{customError}</div>}
        </div>
      </div>

      {dateRange.startDate && <p className="text-muted small">Showing {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</p>}

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">TOTAL WORKING HOURS</div><h4 className="mb-0 mt-2">{formatDuration(summary.totalWorkingHours)}</h4></div></div></div>
          <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">TOTAL BREAK TIME</div><h4 className="mb-0 mt-2">{formatDuration(summary.totalBreakHours)}</h4></div></div></div>
          <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">AVG HOURS / DAY</div><h4 className="mb-0 mt-2">{formatDuration(summary.averageWorkingHours)}</h4></div></div></div>
          <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">PRESENT DAYS</div><h4 className="mb-0 mt-2">{summary.presentDays} / {summary.totalDays}</h4><div className="text-muted small mt-1">{summary.halfDays} half-day · {summary.absentDays} absent</div></div></div></div>
        </div>
      )}

      {loading ? <div className="alert alert-info">Loading attendance history...</div> : records.length === 0 ? (
        <div className="card border-0 shadow-sm"><div className="card-body text-center py-5"><i className="bi bi-calendar-x fs-1 text-primary" /><h5 className="fw-bold mt-3">No attendance records found</h5><p className="text-muted mb-0">No records for this employee in the selected period.</p></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Date</th><th>Status</th><th>Sessions</th><th>Breaks</th><th>Total hours</th></tr></thead>
                <tbody>
                  {records.map((record) => {
                    const sessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut, breaks: record.breaks || [] }] : []
                    const breakCount = sessions.reduce((count, session) => count + (session.breaks?.length || 0), 0)
                    return (
                      <tr key={record._id}>
                        <td>{new Date(record.date).toLocaleDateString('en-GB')}</td>
                        <td><span className="badge text-bg-light">{record.status || '-'}</span></td>
                        <td>{sessions.length ? sessions.map((session) => `${formatTime(session.checkIn)} - ${formatTime(session.checkOut)}`).join(', ') : '-'}</td>
                        <td>{breakCount || 0}</td>
                        <td>{formatDuration(record.totalWorkingHours)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><span className="text-muted small">{total} record(s)</span><div className="btn-group"><button type="button" className="btn btn-outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="btn btn-outline-secondary disabled">{page} / {totalPages}</span><button type="button" className="btn btn-outline-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
    </div>
  )
}
