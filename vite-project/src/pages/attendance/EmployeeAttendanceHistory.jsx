import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import attendanceApi from '../../api/attendanceApi'
import { PageHeader, StatCard, Badge, EmptyState } from '../../components/ui'

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

function getInitials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || '?'
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
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>You do not have permission to view this page.
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <PageHeader
        eyebrow="WORKFORCE"
        title="Employee Attendance History"
        description="Full attendance record for one employee by date range."
        actions={
          <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => navigate('/attendance')}>
            <i className="bi bi-arrow-left me-1" />Attendance list
          </button>
        }
      />

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      {employee && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: '52px', height: '52px', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--mf-color-primary-subtle), #ede7ff)', color: 'var(--mf-color-primary)' }}
            >
              {getInitials(employee.name)}
            </div>
            <div>
              <h5 className="fw-bold mb-1">{employee.name || 'Unknown employee'}</h5>
              <div className="text-muted small">
                {employee.employeeId || 'No employee ID'} · {employee.email || 'No email'} · <span className="text-capitalize">{String(employee.role || '-').replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
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
          {customError && <div className="text-danger small mt-2"><i className="bi bi-exclamation-circle me-1"></i>{customError}</div>}
        </div>
      </div>

      {dateRange.startDate && (
        <p className="text-muted small mb-3">
          <i className="bi bi-calendar3 me-1"></i>Showing {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
        </p>
      )}

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <StatCard icon="bi-hourglass-split" label="TOTAL WORKING HOURS" value={formatDuration(summary.totalWorkingHours)} />
          </div>
          <div className="col-sm-6 col-lg-3">
            <StatCard icon="bi-cup-hot" label="TOTAL BREAK TIME" value={formatDuration(summary.totalBreakHours)} />
          </div>
          <div className="col-sm-6 col-lg-3">
            <StatCard icon="bi-graph-up" label="AVG HOURS / DAY" value={formatDuration(summary.averageWorkingHours)} />
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="mf-stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="mf-stat-card__label">PRESENT DAYS</div>
                  <div className="mf-stat-card__value">{summary.presentDays} / {summary.totalDays}</div>
                  <div className="text-muted small mt-1">{summary.halfDays} half-day · {summary.absentDays} absent</div>
                </div>
                <div className="mf-stat-card__icon" style={{ backgroundColor: 'var(--mf-color-primary-subtle)', color: 'var(--mf-color-primary)' }}>
                  <i className="bi bi-calendar-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted mb-0">Loading attendance history...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body">
            <EmptyState icon="bi-calendar-x" title="No attendance records found" description="No records for this employee in the selected period." />
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="border-bottom">
                    <th className="py-3 text-muted small text-uppercase">Date</th>
                    <th className="py-3 text-muted small text-uppercase">Status</th>
                    <th className="py-3 text-muted small text-uppercase">Sessions</th>
                    <th className="py-3 text-muted small text-uppercase">Breaks</th>
                    <th className="py-3 text-muted small text-uppercase">Total hours</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const sessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut, breaks: record.breaks || [] }] : []
                    const breakCount = sessions.reduce((count, session) => count + (session.breaks?.length || 0), 0)
                    return (
                      <tr key={record._id}>
                        <td className="py-3">{new Date(record.date).toLocaleDateString('en-GB')}</td>
                        <td className="py-3"><Badge status={record.status} /></td>
                        <td className="py-3">{sessions.length ? sessions.map((session) => `${formatTime(session.checkIn)} - ${formatTime(session.checkOut)}`).join(', ') : '-'}</td>
                        <td className="py-3">{breakCount || 0}</td>
                        <td className="py-3">{formatDuration(record.totalWorkingHours)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
          <span className="text-muted small">{total} record(s)</span>
          <div className="btn-group">
            <button type="button" className="btn btn-outline-secondary rounded-start-3" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <span className="btn btn-outline-secondary disabled">{page} / {totalPages}</span>
            <button type="button" className="btn btn-outline-secondary rounded-end-3" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
