import { useEffect, useState } from 'react'
import activityApi from '../../api/activityApi'
import projectApi from '../../api/projectApi'

const DailyActivity = () => {
  const [activities, setActivities] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: '', hoursWorked: 8, status: 'IN_PROGRESS', projectId: '', notes: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [activityResponse, projectResponse] = await Promise.all([activityApi.listActivities(), projectApi.listProjects()])
      setActivities(activityResponse.activities || [])
      setProjects(projectResponse.projects || [])
    } catch (err) { setError(err?.response?.data?.message || 'Unable to load work activity') }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([activityApi.listActivities(), projectApi.listProjects()]).then(([activityResponse, projectResponse]) => {
      if (cancelled) return
      setActivities(activityResponse.activities || [])
      setProjects(projectResponse.projects || [])
    }).catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Unable to load work activity') })
    return () => { cancelled = true }
  }, [])

  const submit = async event => {
    event.preventDefault()
    try {
      await activityApi.createActivity({ ...form, hoursWorked: Number(form.hoursWorked), projectId: form.projectId || undefined })
      setForm(current => ({ ...current, description: '', notes: '' }))
      load()
    } catch (err) { setError(err?.response?.data?.message || 'Unable to submit activity') }
  }

  return <div>
    <h2>Daily Work Activity</h2>
    {error && <div className="alert alert-danger">{error}</div>}
    <form className="row g-2 mb-4" onSubmit={submit}>
      <div className="col-md-2"><input className="form-control" type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></div>
      <div className="col-md-3"><input className="form-control" placeholder="Work description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required /></div>
      <div className="col-md-2"><select className="form-select" value={form.projectId} onChange={event => setForm({ ...form, projectId: event.target.value })}><option value="">Project</option>{projects.map(project => <option key={project._id} value={project._id}>{project.name}</option>)}</select></div>
      <div className="col-md-1"><input className="form-control" type="number" min="0" max="24" step="0.5" value={form.hoursWorked} onChange={event => setForm({ ...form, hoursWorked: event.target.value })} required /></div>
      <div className="col-md-2"><select className="form-select" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option>TODO</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>BLOCKED</option></select></div>
      <div className="col-md-2"><button className="btn btn-primary">Submit activity</button></div>
    </form>
    {!activities.length && <div className="alert alert-info">No activity submitted yet.</div>}
    <div className="table-responsive"><table className="table table-striped"><thead><tr><th>Date</th><th>Description</th><th>Project</th><th>Hours</th><th>Status</th></tr></thead><tbody>{activities.map(activity => <tr key={activity._id}><td>{new Date(activity.date).toLocaleDateString()}</td><td>{activity.description}</td><td>{activity.projectId?.name || '-'}</td><td>{activity.hoursWorked}</td><td>{activity.status}</td></tr>)}</tbody></table></div>
  </div>
}

export default DailyActivity
