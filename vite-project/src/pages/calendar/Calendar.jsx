import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import calendarApi from '../../api/calendarApi'

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
  const canManage = ['admin', 'company_owner', 'hr_manager', 'hr'].includes(role)
  const [holidays, setHolidays] = useState([])
  const [workingDays, setWorkingDays] = useState([])
  const [form, setForm] = useState({ name: '', date: '', endDate: '', type: 'COMPANY', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
          <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h5 className="fw-bold mb-1">Working week</h5><p className="text-muted mb-0">{workingDays.length} working {workingDays.length === 1 ? 'day' : 'days'} per week</p></div>{canManage && <button className="btn btn-primary" disabled={saving || !workingDays.length} onClick={saveSettings}>Save working days</button>}</div><div className="row g-2 mt-3">{days.map(([value, label]) => <div className="col-6 col-sm-4 col-lg" key={value}><button type="button" disabled={!canManage} className={`btn w-100 ${workingDays.includes(value) ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => toggleDay(value)}>{label}</button></div>)}</div></div></div>
          {canManage && <div className="card border-0 shadow-sm mb-4"><div className="card-body"><h5 className="fw-bold mb-3">Add holiday</h5><form onSubmit={addHoliday}><div className="row g-3"><div className="col-md-6"><label className="form-label">Holiday name</label><input required className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="col-md-3"><label className="form-label">Start date</label><input required type="date" className="form-control" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div className="col-md-3"><label className="form-label">End date</label><input type="date" className="form-control" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></div><div className="col-md-4"><label className="form-label">Holiday type</label><select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="COMPANY">Company holiday</option><option value="OPTIONAL">Optional holiday</option></select></div><div className="col-md-8"><label className="form-label">Description</label><input className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="col-12"><button className="btn btn-success" disabled={saving} type="submit">Add holiday</button></div></div></form></div></div>}
          <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold mb-3">Company holidays</h5>{holidays.length ? <div className="row g-3">{holidays.map((holiday) => <div className="col-md-6 col-xl-4" key={holiday._id}><div className="border rounded p-3 h-100"><div className="d-flex justify-content-between gap-2"><strong>{holiday.name}</strong><span className="badge text-bg-light">{holiday.type}</span></div><div className="text-muted mt-2">{new Date(holiday.date).toLocaleDateString()}{holiday.endDate ? ` - ${new Date(holiday.endDate).toLocaleDateString()}` : ''}</div>{holiday.description && <p className="small text-muted mb-0 mt-2">{holiday.description}</p>}{canManage && <button className="btn btn-sm btn-outline-danger mt-3" disabled={saving} onClick={() => removeHoliday(holiday._id)}>Remove</button>}</div></div>)}</div> : <div className="text-center text-muted py-4">No holidays have been added.</div>}</div></div>
        </>
      )}
    </div>
  )
}
