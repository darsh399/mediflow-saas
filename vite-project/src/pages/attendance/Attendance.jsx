import { useEffect, useState } from 'react'
import attendanceApi from '../../api/attendanceApi'

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
}

function formatDuration(hours) {
  const totalMinutes = Math.max(0, Math.round(Number(hours || 0) * 60))
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
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
  const [today, setToday] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setLoading(true)
      const [current, history] = await Promise.all([attendanceApi.getToday(), attendanceApi.listAttendance({ limit: 10 })])
      setToday(current.attendance)
      setRecords(history.attendance || [])
      setError('')
    } catch (requestError) {
      setError(requestMessage(requestError, 'Unable to load attendance'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="text-primary fw-semibold small">WORKFORCE</span>
          <h2 className="fw-bold mb-1 mt-1">Attendance</h2>
          <p className="text-muted mb-0">Track today&apos;s work time and attendance history.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={actionLoading || checkedIn} onClick={() => runAction('checkIn')}>Check in</button>
          <button className="btn btn-outline-primary" disabled={actionLoading || !checkedIn} onClick={() => runAction('checkOut')}>Check out</button>
          <button className="btn btn-outline-secondary" disabled={actionLoading || !checkedIn} onClick={() => runAction('break')}>{activeBreak ? 'End break' : 'Start break'}</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? <div className="alert alert-info">Loading attendance...</div> : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">STATUS</div><h4 className="mb-0 mt-2">{today?.status || 'Not started'}</h4></div></div></div>
            <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">CURRENT SESSION</div><h4 className="mb-0 mt-2">{formatTime(activeSession?.checkIn)}</h4></div></div></div>
            <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">SESSIONS TODAY</div><h4 className="mb-0 mt-2">{sessions.length}</h4></div></div></div>
            <div className="col-sm-6 col-lg-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small">WORKING HOURS</div><h4 className="mb-0 mt-2">{formatDuration(today?.totalWorkingHours)}</h4></div></div></div>
          </div>
          <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold mb-3">Recent attendance</h5><div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Date</th><th>Status</th><th>Sessions</th><th>Total hours</th></tr></thead><tbody>{records.length ? records.map((record) => { const recordSessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut }] : []; return <tr key={record._id}><td>{new Date(record.date).toLocaleDateString()}</td><td>{record.status}</td><td>{recordSessions.map((session) => `${formatTime(session.checkIn)} - ${formatTime(session.checkOut)}`).join(', ') || '-'}</td><td>{formatDuration(record.totalWorkingHours)}</td></tr> }) : <tr><td colSpan="4" className="text-center text-muted py-4">No attendance records yet.</td></tr>}</tbody></table></div></div></div>
        </>
      )}
    </div>
  )
}
