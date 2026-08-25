import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchEmployeeVisitSummary, fetchEmployeeVisits, fetchVisitCalendarSummary } from '../../redux/slices/visitSlice'
import { addDays, endOfMonth, formatDateInput, startOfMonth, startOfWeek, toDateKey } from '../../utils/calendarDates'

const RANGE_OPTIONS = [
  ['TODAY', 'Today'],
  ['YESTERDAY', 'Yesterday'],
  ['LAST_7_DAYS', 'Last 7 days'],
  ['THIS_WEEK', 'This week'],
  ['LAST_WEEK', 'Last week'],
  ['THIS_MONTH', 'This month'],
  ['LAST_MONTH', 'Last month'],
  ['CUSTOM', 'Custom range'],
]

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : '-'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'
}

function visitTarget(visit) {
  if (visit.doctorId) return { type: 'Doctor', name: visit.doctorId.name || '-' }
  if (visit.medicalId) return { type: 'Medical', name: visit.medicalId.name || '-' }
  return { type: 'Visit', name: '-' }
}

export default function VisitRecords() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const summary = useSelector((state) => state.visits.employeeSummary)
  const history = useSelector((state) => state.visits.employeeHistory)
  const calendarSummary = useSelector((state) => state.visits.calendarSummary)
  const [range, setRange] = useState('TODAY')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [limit, setLimit] = useState(20)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  useEffect(() => {
    if (range === 'CUSTOM' && (!customStart || !customEnd)) return
    if (range === 'CUSTOM' && customStart > customEnd) return
    const params = range === 'CUSTOM' ? { startDate: customStart, endDate: customEnd, page, limit } : { range, page, limit }
    if (employeeId) dispatch(fetchEmployeeVisits({ employeeId, params }))
    else dispatch(fetchEmployeeVisitSummary({ ...params, search }))
  }, [dispatch, employeeId, range, customStart, customEnd, page, limit, search])

  useEffect(() => {
    if (!employeeId) return
    dispatch(fetchVisitCalendarSummary({ employeeId, startDate: formatDateInput(startOfMonth(calendarMonth)), endDate: formatDateInput(endOfMonth(calendarMonth)) }))
  }, [dispatch, employeeId, calendarMonth])

  const changeRange = (value) => {
    setRange(value)
    setPage(1)
  }

  const changeSearch = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const pagination = employeeId ? history.pagination : summary.pagination
  const total = pagination.total || 0
  const totalPages = pagination.totalPages || 0
  const items = employeeId ? history.items : summary.items
  const loading = employeeId ? history.loading : summary.loading
  const error = employeeId ? history.error : summary.error
  const dateRange = employeeId ? history.dateRange : summary.dateRange
  const customError = range === 'CUSTOM' && customStart && customEnd && customStart > customEnd ? 'From date cannot be after To date' : ''
  const calendarDays = (() => {
    const start = startOfWeek(startOfMonth(calendarMonth))
    const end = addDays(startOfWeek(endOfMonth(calendarMonth)), 6)
    return Array.from({ length: Math.round((end - start) / 86400000) + 1 }, (_, index) => addDays(start, index))
  })()
  const visitCounts = Object.fromEntries(calendarSummary.items.map((item) => [item.date, item.count]))
  const todayKey = toDateKey(new Date())
  const monthOptions = Array.from({ length: 12 }, (_, index) => index)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 21 }, (_, index) => currentYear - 10 + index)

  const selectCalendarDate = (date) => {
    const dateKey = toDateKey(date)
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setRange('CUSTOM')
    setCustomStart(dateKey)
    setCustomEnd(dateKey)
    setPage(1)
  }

  const selectToday = () => {
    const today = new Date()
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setRange('TODAY')
    setCustomStart('')
    setCustomEnd('')
    setPage(1)
  }

  return (
    <div className="container-fluid py-4">
      {employeeId && <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div className="d-flex align-items-center gap-2"><button type="button" className="btn btn-outline-secondary" aria-label="Previous month" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><i className="bi bi-chevron-left" /></button><h5 className="fw-bold mb-0 calendar-month-title">{calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h5><button type="button" className="btn btn-outline-secondary" aria-label="Next month" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><i className="bi bi-chevron-right" /></button></div><div className="d-flex flex-wrap gap-2"><select className="form-select" value={calendarMonth.getMonth()} onChange={(event) => setCalendarMonth(new Date(calendarMonth.getFullYear(), Number(event.target.value), 1))} aria-label="Select month">{monthOptions.map((month) => <option key={month} value={month}>{new Date(2000, month, 1).toLocaleDateString('en-IN', { month: 'long' })}</option>)}</select><select className="form-select" value={calendarMonth.getFullYear()} onChange={(event) => setCalendarMonth(new Date(Number(event.target.value), calendarMonth.getMonth(), 1))} aria-label="Select year">{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select><button type="button" className="btn btn-primary" onClick={selectToday}>Today</button></div></div><div className="visit-calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span className="small fw-semibold text-muted text-center" key={day}>{day}</span>)}</div>{calendarSummary.loading ? <div className="text-muted small py-4 text-center">Loading visit counts...</div> : <div className="visit-month-grid">{calendarDays.map((date) => { const key = toDateKey(date); const isCurrentMonth = date.getMonth() === calendarMonth.getMonth(); const isSelected = (range === 'CUSTOM' && customStart === customEnd && customStart === key) || (range === 'TODAY' && key === todayKey); const count = visitCounts[key] || 0; return <button type="button" className={`visit-calendar-day ${isCurrentMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${key === todayKey ? 'today' : ''}`} key={key} onClick={() => selectCalendarDate(date)}><span>{date.getDate()}</span>{count > 0 && <small>{count} visit{count === 1 ? '' : 's'}</small>}</button> })}</div>}{calendarSummary.error && <div className="text-danger small mt-2">{calendarSummary.error.message || String(calendarSummary.error)}</div>}<div className="small text-muted mt-3"><span className="me-3"><i className="bi bi-circle-fill text-primary me-1" />Selected</span><span><i className="bi bi-dot text-danger me-1" />Today</span></div></div></div>}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="text-primary fw-semibold small">FIELD OPERATIONS</span>
          <h2 className="fw-bold mb-1 mt-1">{employeeId ? 'Employee Visit History' : 'MR Visit Records'}</h2>
          <p className="text-muted mb-0">{employeeId ? 'Review visits for one employee by date range.' : 'Review employee activity without loading every visit record.'}</p>
        </div>
        {employeeId ? <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/visits')}><i className="bi bi-arrow-left me-1" />Employee list</button> : <Link className="btn btn-primary" to="/mr/add-visit"><i className="bi bi-plus-lg me-1" />Add visit</Link>}
      </div>

      {employeeId && history.employee && <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between gap-3"><div><h5 className="fw-bold mb-1">{history.employee.name}</h5><div className="text-muted">{history.employee.employeeId || 'No employee ID'} · {history.employee.email || 'No email'}</div></div><div className="text-md-end"><div className="small text-muted">Total visits in range</div><h4 className="mb-0">{total}</h4></div></div></div></div>}

      <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="row g-3 align-items-end"><div className={employeeId ? 'col-md-3' : 'col-md-4'}>{!employeeId && <><label className="form-label fw-semibold" htmlFor="visit-employee-search">Search employee</label><input id="visit-employee-search" className="form-control" value={search} onChange={changeSearch} placeholder="Name, employee ID, or email" /></>}</div><div className="col-md-3"><label className="form-label fw-semibold" htmlFor="visit-date-range">Date range</label><select id="visit-date-range" className="form-select" value={range} onChange={(event) => changeRange(event.target.value)}>{RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="col-md-2"><label className="form-label fw-semibold" htmlFor="visit-page-size">Rows per page</label><select id="visit-page-size" className="form-select" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></div>{range === 'CUSTOM' && <><div className="col-md-2"><label className="form-label fw-semibold" htmlFor="visit-start-date">From</label><input id="visit-start-date" type="date" className="form-control" value={customStart} onChange={(event) => { setCustomStart(event.target.value); setPage(1) }} /></div><div className="col-md-2"><label className="form-label fw-semibold" htmlFor="visit-end-date">To</label><input id="visit-end-date" type="date" className="form-control" value={customEnd} onChange={(event) => { setCustomEnd(event.target.value); setPage(1) }} /></div></>}</div>{customError && <div className="text-danger small mt-2">{customError}</div>}</div></div>

      {error && <div className="alert alert-danger" role="alert">{error.message || String(error)}</div>}
      {dateRange.startDate && <p className="text-muted small">Showing {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</p>}
      {loading ? <div className="alert alert-info">Loading {employeeId ? 'visits' : 'employees'}...</div> : items.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body text-center py-5"><i className="bi bi-clipboard-x fs-1 text-primary" /><h5 className="fw-bold mt-3">No {employeeId ? 'visits' : 'employees'} found</h5><p className="text-muted mb-0">{employeeId ? `No visits found for ${formatDate(dateRange.startDate)}.` : 'No employees match your search.'}</p></div></div> : employeeId ? <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Visit</th><th>Type</th><th>Date and time</th><th>Location</th><th>Distance</th><th>Status</th></tr></thead><tbody>{items.map((visit) => { const target = visitTarget(visit); return <tr key={visit._id}><td><div className="fw-semibold">{target.name}</div><div className="small text-muted">{visit.purpose || '-'}</div></td><td>{target.type}</td><td>{formatDateTime(visit.visitedAt)}</td><td>{visit.visitLatitude != null && visit.visitLongitude != null ? `${visit.visitLatitude}, ${visit.visitLongitude}` : '-'}</td><td>{visit.distanceInMeters != null ? `${visit.distanceInMeters} m` : '-'}</td><td><span className="badge text-bg-light">{visit.status || '-'}</span></td></tr> })}</tbody></table></div></div></div> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Employee</th><th>Employee ID</th><th>Visits in range</th><th>Last visit</th><th>Status</th><th /></tr></thead><tbody>{items.map((employee) => <tr key={employee._id}><td><div className="fw-semibold">{employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown employee'}</div><div className="small text-muted">{employee.email || '-'}</div></td><td>{employee.employeeId || '-'}</td><td>{employee.visitCount || 0}</td><td>{formatTime(employee.lastVisit)}</td><td>{employee.active === false ? 'Inactive' : 'Active'}</td><td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/admin/visits/${employee._id}`)}>View visits</button></td></tr>)}</tbody></table></div></div></div>}

      {totalPages > 1 && <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><span className="text-muted small">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</span><div className="btn-group"><button type="button" className="btn btn-outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="btn btn-outline-secondary disabled">{page} / {totalPages}</span><button type="button" className="btn btn-outline-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
    </div>
  )
}
