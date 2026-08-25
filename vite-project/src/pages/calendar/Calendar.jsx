import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import calendarApi from '../../api/calendarApi'
import leaveApi from '../../api/leaveApi'
import { addDays, eachDay, formatDateInput, formatDay, monthLabel, rangeForView, startOfMonth, toDateKey } from '../../utils/calendarDates'

const days = [
  ['MONDAY', 'Monday'],
  ['TUESDAY', 'Tuesday'],
  ['WEDNESDAY', 'Wednesday'],
  ['THURSDAY', 'Thursday'],
  ['FRIDAY', 'Friday'],
  ['SATURDAY', 'Saturday'],
  ['SUNDAY', 'Sunday'],
]

export default function Calendar() {
  const role = useSelector((state) => state.auth.user?.role)
  // Only hr_manager/company_owner/admin can add/remove holidays or set working
  // days — normal hr can view the calendar but not manage it.
  const canManage = ['admin', 'company_owner', 'hr_manager'].includes(role)
  const [holidays, setHolidays] = useState([])
  const [workingDays, setWorkingDays] = useState([])
  const [form, setForm] = useState({ name: '', date: '', endDate: '', type: 'COMPANY', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [leaves, setLeaves] = useState([])
  const [view, setView] = useState('week')
  const [viewDate, setViewDate] = useState(new Date())
  const [displayFilter, setDisplayFilter] = useState('all')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all')
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState('')
  const isReviewer = ['admin', 'company_owner', 'hr_manager', 'hr'].includes(role)

  useEffect(() => {
    async function load() {
      try {
        const [holidayResponse, settingsResponse] = await Promise.all([calendarApi.listHolidays(), calendarApi.getSettings()])
        setHolidays(holidayResponse.holidays || [])
        setWorkingDays(settingsResponse.weeklyWorkingDays || [])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load calendar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    async function loadVisibleData() {
      const visibleRange = rangeForView(viewDate, view)
      const params = { from: formatDateInput(visibleRange.start), to: formatDateInput(visibleRange.end) }
      try {
        setCalendarLoading(true)
        setCalendarError('')
        const response = isReviewer ? await leaveApi.listLeaves(params) : await leaveApi.listMyLeaves(params)
        setLeaves(response.leaves || [])
      } catch (requestError) {
        setCalendarError(requestError.response?.data?.message || 'Unable to load leave events')
      } finally {
        setCalendarLoading(false)
      }
    }
    loadVisibleData()
  }, [isReviewer, view, viewDate])

  const visibleRange = rangeForView(viewDate, view)
  const leaveTypes = [...new Set(leaves.map((leave) => leave.leaveType || leave.type).filter(Boolean))]

  function holidayForDay(date) {
    const key = toDateKey(date)
    return holidays.find((holiday) => {
      const start = String(holiday.date || '').slice(0, 10)
      const end = String(holiday.endDate || holiday.date || '').slice(0, 10)
      return key >= start && key <= end
    })
  }

  function leavesForDay(date) {
    const key = toDateKey(date)
    return leaves.filter((leave) => {
      const start = String(leave.startDate || leave.fromDate || '').slice(0, 10)
      const end = String(leave.endDate || leave.toDate || '').slice(0, 10)
      const type = leave.leaveType || leave.type
      return key >= start && key <= end && (leaveTypeFilter === 'all' || type === leaveTypeFilter)
    })
  }

  function dayInfo(date) {
    const holiday = holidayForDay(date)
    const dayLeaves = leavesForDay(date)
    const isWorkingDay = workingDays.includes(days[(date.getDay() + 6) % 7][0])
    const companyOff = holiday?.type === 'COMPANY' || !isWorkingDay
    return { holiday, leaves: dayLeaves, isWorkingDay, companyOff }
  }

  function shouldShowDay(info) {
    if (displayFilter === 'working') return info.isWorkingDay && !info.holiday
    if (displayFilter === 'leave') return info.leaves.length > 0 && !info.holiday
    if (displayFilter === 'company-off') return info.companyOff
    return true
  }

  function shiftView(amount) {
    if (view === 'week') setViewDate((date) => addDays(date, amount * 7))
    else if (view === 'month') setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1))
    else setViewDate((date) => new Date(date.getFullYear() + amount, 0, 1))
  }

  function renderDay(date, compact = false) {
    const info = dayInfo(date)
    const isToday = toDateKey(date) === toDateKey(new Date())
    const background = info.holiday?.type === 'COMPANY' ? '#ffe5e5' : info.holiday ? '#fff3cd' : info.leaves.length ? '#e5f0ff' : info.companyOff ? '#ffe5e5' : '#eaf7ed'
    return <div key={toDateKey(date)} className={`border rounded p-2 ${compact ? 'small' : ''}`} style={{ backgroundColor: shouldShowDay(info) ? background : '#f8f9fa', opacity: shouldShowDay(info) ? 1 : 0.35, minHeight: compact ? '74px' : '125px' }}><div className="d-flex justify-content-between gap-2"><strong className={isToday ? 'text-primary' : ''}>{compact ? date.getDate() : `${date.toLocaleDateString('en-IN', { weekday: 'short' })} ${date.getDate()}`}</strong>{isToday && <span className="badge text-bg-primary">Today</span>}</div>{info.holiday && <div className="small fw-semibold text-danger mt-2">{info.holiday.name}</div>}{info.leaves.map((leave) => <div className="small text-primary mt-1" key={leave._id}>{leave.leaveType || leave.type} · {leave.status}</div>)}{!info.holiday && !info.leaves.length && <div className={`small mt-2 ${info.companyOff ? 'text-danger' : 'text-success'}`}>{info.companyOff ? 'Company off' : 'Working day'}</div>}</div>
  }

  function toggleDay(day) {
    setWorkingDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])
  }

  async function saveSettings() {
    try {
      setSaving(true)
      const response = await calendarApi.updateSettings(workingDays)
      setWorkingDays(response.weeklyWorkingDays)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update working days')
    } finally {
      setSaving(false)
    }
  }

  async function addHoliday(event) {
    event.preventDefault()
    try {
      setSaving(true)
      const response = await calendarApi.createHoliday(form)
      setHolidays((current) => [...current, response.holiday].sort((first, second) => new Date(first.date) - new Date(second.date)))
      setForm({ name: '', date: '', endDate: '', type: 'COMPANY', description: '' })
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add holiday')
    } finally {
      setSaving(false)
    }
  }

  async function removeHoliday(id) {
    try {
      setSaving(true)
      await calendarApi.deleteHoliday(id)
      setHolidays((current) => current.filter((holiday) => holiday._id !== id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove holiday')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <span className="text-primary fw-semibold small">WORKSPACE</span>
        <h2 className="fw-bold mb-1 mt-1">Calendar</h2>
        <p className="text-muted mb-0">Company holidays and upcoming days off.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <div className="alert alert-info">Loading calendar...</div> : (
        <>
          <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3"><div><h5 className="fw-bold mb-1">Work calendar</h5><p className="text-muted mb-0">{view === 'year' ? viewDate.getFullYear() : view === 'month' ? monthLabel(viewDate) : `${formatDay(visibleRange.start)} - ${formatDay(visibleRange.end)}`}</p></div><div className="btn-group" role="group" aria-label="Calendar view"><button type="button" className="btn btn-outline-secondary" onClick={() => shiftView(-1)} aria-label="Previous period"><i className="bi bi-chevron-left" /></button><button type="button" className="btn btn-outline-secondary" onClick={() => setViewDate(new Date())}>Today</button><button type="button" className="btn btn-outline-secondary" onClick={() => shiftView(1)} aria-label="Next period"><i className="bi bi-chevron-right" /></button></div></div><div className="d-flex flex-wrap gap-2 mb-3"><div className="btn-group" role="group" aria-label="Calendar period"><button type="button" className={`btn ${view === 'week' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('week')}>7 days</button><button type="button" className={`btn ${view === 'month' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('month')}>Month</button><button type="button" className={`btn ${view === 'year' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('year')}>Year</button></div><select className="form-select" style={{ maxWidth: '190px' }} value={displayFilter} onChange={(event) => setDisplayFilter(event.target.value)} aria-label="Calendar display filter"><option value="all">Show all days</option><option value="working">Working days</option><option value="leave">Leave days</option><option value="company-off">Company offs</option></select><select className="form-select" style={{ maxWidth: '190px' }} value={leaveTypeFilter} onChange={(event) => setLeaveTypeFilter(event.target.value)} aria-label="Leave type filter"><option value="all">All leave types</option>{leaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>{calendarError && <div className="alert alert-danger py-2">{calendarError}</div>}{calendarLoading ? <div className="alert alert-info py-2">Loading calendar events...</div> : view === 'year' ? <div className="row g-3">{Array.from({ length: 12 }, (_, month) => { const monthDate = new Date(viewDate.getFullYear(), month, 1); const monthDays = eachDay(startOfMonth(monthDate), new Date(viewDate.getFullYear(), month + 1, 0)); const leaveCount = monthDays.reduce((count, date) => count + dayInfo(date).leaves.length, 0); const offCount = monthDays.filter((date) => dayInfo(date).companyOff).length; return <div className="col-6 col-md-4 col-xl-3" key={month}><div className="border rounded p-3 h-100"><div className="fw-semibold mb-2">{monthDate.toLocaleDateString('en-IN', { month: 'long' })}</div><div className="small text-muted">{monthDays.length - offCount} working days</div><div className="small text-danger">{offCount} company offs</div><div className="small text-primary">{leaveCount} leave events</div></div></div> })}</div> : <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 row-cols-xl-7 g-2">{eachDay(visibleRange.start, visibleRange.end).map((date) => renderDay(date))}</div>}<div className="d-flex flex-wrap gap-3 mt-3 small"><span><i className="bi bi-square-fill text-success me-1" />Working day</span><span><i className="bi bi-square-fill text-danger me-1" />Company off</span><span><i className="bi bi-square-fill text-warning me-1" />Optional holiday</span><span><i className="bi bi-square-fill text-primary me-1" />Leave</span></div></div></div>
          <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h5 className="fw-bold mb-1">Working week</h5><p className="text-muted mb-0">{workingDays.length} working {workingDays.length === 1 ? 'day' : 'days'} per week</p></div>{canManage && <button className="btn btn-primary" disabled={saving || !workingDays.length} onClick={saveSettings}>Save working days</button>}</div><div className="row g-2 mt-3">{days.map(([value, label]) => <div className="col-6 col-sm-4 col-lg" key={value}><button type="button" disabled={!canManage} className={`btn w-100 ${workingDays.includes(value) ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => toggleDay(value)}>{label}</button></div>)}</div></div></div>
          {canManage && <div className="card border-0 shadow-sm mb-4"><div className="card-body"><h5 className="fw-bold mb-3">Add holiday</h5><form onSubmit={addHoliday}><div className="row g-3"><div className="col-md-6"><label className="form-label">Holiday name</label><input required className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="col-md-3"><label className="form-label">Start date</label><input required type="date" className="form-control" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div className="col-md-3"><label className="form-label">End date</label><input type="date" className="form-control" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></div><div className="col-md-4"><label className="form-label">Holiday type</label><select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="COMPANY">Company holiday</option><option value="OPTIONAL">Optional holiday</option></select></div><div className="col-md-8"><label className="form-label">Description</label><input className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="col-12"><button className="btn btn-success" disabled={saving} type="submit">Add holiday</button></div></div></form></div></div>}
          <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold mb-3">Company holidays</h5>{holidays.length ? <div className="row g-3">{holidays.map((holiday) => <div className="col-md-6 col-xl-4" key={holiday._id}><div className="border rounded p-3 h-100"><div className="d-flex justify-content-between gap-2"><strong>{holiday.name}</strong><span className="badge text-bg-light">{holiday.type}</span></div><div className="text-muted mt-2">{new Date(holiday.date).toLocaleDateString()}{holiday.endDate ? ` - ${new Date(holiday.endDate).toLocaleDateString()}` : ''}</div>{holiday.description && <p className="small text-muted mb-0 mt-2">{holiday.description}</p>}{canManage && <button className="btn btn-sm btn-outline-danger mt-3" disabled={saving} onClick={() => removeHoliday(holiday._id)}>Remove</button>}</div></div>)}</div> : <div className="text-center text-muted py-4">No holidays have been added.</div>}</div></div>
        </>
      )}
    </div>
  )
}
